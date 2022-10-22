import ts from "typescript";
import { typeTraversal, createFakeType } from "./printer";
import { codePrinter } from "./main";

const count_nodes = (child: ts.Node): number => {
  let count = 1;
  child.forEachChild((c) => {
    count += count_nodes(c);
  });
  return count;
};

// gets the number of comments from a source file. both trailing and leading
const get_comments = (s: ts.SourceFile): number => {
  let count = 0;
  const leading = ts.getLeadingCommentRanges(s.getFullText(), 0);
  const trailing = ts.getTrailingCommentRanges(s.getFullText(), 0);
  if (leading) {
    count += leading.length;
  }
  if (trailing) {
    count += trailing.length;
  }
  return count;
};

export const checkCompleted = (
  original: ts.SourceFile,
  completed: ts.SourceFile,
  completedChecker: ts.TypeChecker
): [boolean, number] => {
  let isCompleted = true;
  let score = 0;
  // checks completed types and scores them
  completed.forEachChild((child) => {
    typeTraversal(child, (ty) => {
      // means codex removed the type
      if (!ty) {
        isCompleted = false;
        return ty;
      }

      const tsType = completedChecker.getTypeFromTypeNode(ty);
      // we have to rule out literals, because they are not "real" types and are prone to errors
      if (tsType.isLiteral()) {
        console.log("literal");
        isCompleted = false;
        return ty;
      }

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
        // console.log("type: ", tsType);
        if (typeFlags & ts.TypeFlags.Any) {
          // any is a special case, because it is a "catch all" type, we may need to check if it's
          // unresolved
          const printed = codePrinter.printNode(
            ts.EmitHint.Unspecified,
            completedChecker.typeToTypeNode(tsType)!,
            completed
          );
          if (printed === "any") {
            // console.log("got any");
            score += 5;
          }
        } else if (typeFlags & ts.TypeFlags.Unknown) {
          // console.log("got unknown");
          score += 10;
        } else if (typeFlags & ts.TypeFlags.Undefined) {
          // console.log("got undefined");
          score += 2;
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
          } else if (objType.objectFlags & ts.ObjectFlags.Anonymous) {
            // console.log("got anonymous");
            // anonymous objects are usually functions, so we need to check return and argument types
            const funcType = objType as ts.ObjectType;
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
        }
      };

      checkType(tsType);

      return ty;
    });
  });

  // short circuit if not completed
  if (!isCompleted) {
    return [false, score];
  }

  // now, strip types out of the original and completed
  const originalStripped = ts.getMutableClone(original);
  const completedStripped = ts.getMutableClone(completed);

  // check if it added any weird comments
  let originalComments = get_comments(originalStripped);
  let completedComments = get_comments(completedStripped);

  // short circuit if it added comments
  if (originalComments !== completedComments) {
    return [false, score];
  }

  // now strip types
  const stripTypes = (_: ts.TypeNode | undefined): ts.TypeNode =>
    createFakeType("bleh"); // does not matter what we return here

  originalStripped.forEachChild((child) => {
    typeTraversal(child, stripTypes);
  });
  completedStripped.forEachChild((child) => {
    typeTraversal(child, stripTypes);
  });

  // now, compare the number of nodes in the original and completed
  const originalCount = count_nodes(originalStripped);
  const completedCount = count_nodes(completedStripped);

  return [originalCount === completedCount, score];
};
