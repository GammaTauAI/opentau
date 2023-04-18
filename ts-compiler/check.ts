import ts from "typescript";
import {
  typeTraversal,
  createFakeType,
  isVarDeclBoundFunction,
  getDeepMutableClone,
} from "./utils";
import { codePrinter } from "./utils";

const count_nodes = (child: ts.Node): number => {
  let count = 1;
  child.forEachChild((c) => {
    count += count_nodes(c);
  });
  return count;
};

// gets the number of comments from a source file. both trailing and leading
const get_comment_count = (s: ts.SourceFile): number => {
  let count = 0;
  let text = s.getFullText();
  const visit = (node: ts.Node) => {
    const leading = ts.getLeadingCommentRanges(text, node.getFullStart());
    const trailing = ts.getTrailingCommentRanges(text, node.getEnd());
    if (leading) {
      count += leading.length;
    }
    if (trailing) {
      count += trailing.length;
    }
    node.forEachChild(visit);
  };
  s.forEachChild(visit);
  return count;
};

type CheckProblem = "NotComplete" | "ChangedCode" | "ChangedComments";

export const checkCompleted = (
  original: ts.SourceFile,
  completed: ts.SourceFile,
  completedChecker: ts.TypeChecker
): [CheckProblem[], number] => {
  let isCompleted = true;
  let problems: CheckProblem[] = [];
  let rawScore = 0;

  // this is the number of type nodes (only leaf nodes)
  // encountered in the completed code. used for the final score
  let numTypeNodes = 0;

  // computes the final score. can't be higher than 1000, and can't be lower than 0.
  const computeScore = (rawScore: number, numTypeNodes: number) =>
    numTypeNodes === 0
      ? 0
      : Math.min(
          Math.max(Math.round((rawScore / numTypeNodes) * 1000), 0),
          1000
        );

  // checks completed types and scores them
  completed.forEachChild((toplevelChild) => {
    typeTraversal(toplevelChild, (ty, child) => {
      // means that the model removed the type, or could be a vardecl-bound function
      if (!ty) {
        if (!isVarDeclBoundFunction(child)) {
          rawScore += 0.5;
          numTypeNodes += 1;
          return;
        }
        return ty;
      }

      const tsType = completedChecker.getTypeFromTypeNode(ty);

      // traverse all the types in the type, and find if we have any "unknown" types

      // find which type it is from ts.TypeFlags

      const printed = codePrinter.printNode(
        ts.EmitHint.Unspecified,
        ty,
        completed
      );

      // we need to check holes by string, because the type checker will resovle them to "any"
      if (printed.includes("_hole_")) {
        isCompleted = false;
        return ty;
      }

      const checkType = (tsType: ts.Type) => {
        const typeFlags = tsType.getFlags();
        if (typeFlags & ts.TypeFlags.Any) {
          // any is a special case, because it is a "catch all" type, we may need to check if it's
          // unresolved
          const printed = codePrinter.printNode(
            ts.EmitHint.Unspecified,
            completedChecker.typeToTypeNode(tsType)!,
            completed
          );

          const isUnresolved = (tsType: ts.Type) => {
            const casted = tsType as any;
            if (casted.intrinsicName && casted.intrinsicName === "error") {
              console.log("got unresolved");
              return true;
            }

            return false;
          };

          if (printed === "any" && !isUnresolved(tsType)) {
            console.log("got any");
            console.log(tsType);
            console.log(completedChecker.typeToTypeNode(tsType));
            rawScore += 0.5;
          }
          numTypeNodes += 1;
        } else if (typeFlags & ts.TypeFlags.Unknown) {
          // console.log("got unknown");
          rawScore += 1;
          numTypeNodes += 1;
        } else if (typeFlags & ts.TypeFlags.Undefined) {
          // console.log("got undefined");
          rawScore += 0.2;
          numTypeNodes += 1;
        } else if (typeFlags & ts.TypeFlags.Object) {
          // we may have type arguments, so we need to check those
          const objType = tsType as ts.ObjectType;
          if (objType.objectFlags & ts.ObjectFlags.Reference) {
            // console.log("got object");
            const refType = objType as ts.TypeReference;
            const typeArgs = refType.typeArguments;
            if (typeArgs) {
              typeArgs.forEach((arg) => {
                checkType(arg);
              });
            }
            numTypeNodes += 1;
          } else if (objType.objectFlags & ts.ObjectFlags.Interface) {
            // get symbol, if it's Function, we need to give a bad score, as it is a catch all
            // interface for functions
            const sym = objType.getSymbol();
            if (sym) {
              const name = sym.getName();
              if (name === "Function") {
                rawScore += 0.5;
              }
            }
            numTypeNodes += 1;
          } else if (objType.objectFlags & ts.ObjectFlags.Anonymous) {
            // console.log("got anonymous");
            // anonymous objects are usually functions, so we need to check return and argument types
            const funcType = objType as ts.ObjectType;
            console.log("funcType: ", funcType);
            const callSignatures = funcType.getCallSignatures();
            try {
              const returnType = callSignatures[0].getReturnType();
              const args = callSignatures[0]
                .getParameters()
                .map((sym) =>
                  completedChecker.getTypeOfSymbolAtLocation(sym, child)
                );
              checkType(returnType);
              args.forEach((arg) => {
                checkType(arg);
              });
            } catch (e) {
              console.log("error: ", e);
            }
          }
        } else if (typeFlags & ts.TypeFlags.Union) {
          // console.log("got union");
          const unionType = tsType as ts.UnionType;
          unionType.types.forEach((arg) => {
            checkType(arg);
          });
        } else {
          // NOTE: in our abstract interpretation, this is considered a leaf node
          numTypeNodes += 1;
        }
      };

      checkType(tsType);

      return ty;
    });
  });

  if (!isCompleted) {
    problems.push("NotComplete");
  }

  // now, strip types out of the original and completed
  const originalStripped = getDeepMutableClone(original);
  const completedStripped = getDeepMutableClone(completed);

  // check if it added any weird comments
  let originalComments = get_comment_count(original);
  let completedComments = get_comment_count(completed);

  if (originalComments !== completedComments) {
    problems.push("ChangedComments");
  }

  // now strip types
  const fake = createFakeType("bleh");
  const stripTypes = (_: ts.TypeNode | undefined) => fake;

  originalStripped.forEachChild((child) => {
    typeTraversal(child, stripTypes);
  });
  completedStripped.forEachChild((child) => {
    typeTraversal(child, stripTypes);
  });

  // now, compare the number of nodes in the original and completed
  const originalCount = count_nodes(originalStripped);
  const completedCount = count_nodes(completedStripped);

  if (originalCount !== completedCount) {
    problems.push("ChangedCode");
  }

  return [problems, computeScore(rawScore, numTypeNodes)];
};
