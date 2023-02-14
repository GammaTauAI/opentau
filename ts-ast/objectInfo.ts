import ts from "typescript";
import { codePrinter } from "./main";

// checks if it's a declaration that we would like to alpha-rename
function isDeclaration(node: ts.Node): node is ts.NamedDeclaration {
  return (
    ts.isVariableDeclaration(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isClassDeclaration(node)
  );
}

// for all identifiers, we need to find all identifiers with the same
// name. then, we check for the scope that is the closest to the
// target scope.
const resolveIdentifier = (
  scopedIdentifiers: [string, number[]][],
  myName: string,
  scope: number[]
): ts.Identifier | undefined => {
  for (const [name, scopePath] of scopedIdentifiers) {
    // skip if the name doesn't match
    if (name !== myName) {
      continue;
    }

    // skip scopePaths that are larger than the target scope
    if (scopePath.length > scope.length) {
      continue;
    }

    // check if the scopePath is a prefix of the target scope
    let isPrefix = true;
    for (let i = 0; i < scopePath.length; i++) {
      if (scopePath[i] !== scope[i]) {
        isPrefix = false;
        break;
      }
    }

    // if it is a prefix, we need to update the identifier
    if (isPrefix && scopePath.length !== 0) {
      return ts.createIdentifier(`${name}$${scopePath.join("_")}`);
    }
  }
};

// Transformer that alpha-renames all identifiers in a source file.
// If we have a NamedDeclaration, we need to update the name in the symbol table.
// If we have an Identifier, we need to update the text of the node, with the
// one from the symbol table.
//
// TODO: worry about namespaces
const alphaRenameTransformer: ts.TransformerFactory<ts.SourceFile> = (
  context
) => {
  return (sourceFile) => {
    // NOTE: we do two passes here for mutual recursion and dependency reasons.

    // [name, scope_path] list
    const scopedIdentifiers: [string, number[]][] = [];
    let counter = 0;
    const makeDeclarationVisitor = (scope: number[]) => {
      const visit: ts.Visitor = (node) => {
        // the localScope is a temporary variable that we use to update the
        // scope path for only this scope, and not the children scopes.
        let localScope = [...scope];

        if (isDeclaration(node)) {
          // we could either have a variable declaration or a function declaration,
          // which also has parameters. we need to update the symbol table for
          // both of these cases.
          if (node.name && ts.isIdentifier(node.name)) {
            scopedIdentifiers.push([node.name.text, localScope]);
          }
        }

        if (
          ts.isFunctionLike(node) &&
          // we don't want to update the parameters of constructors
          !ts.isConstructorDeclaration(node) &&
          node.parameters
        ) {
          // when updating parameters of functions, we anticipate a new scope
          localScope = [...localScope, counter];
          for (const param of node.parameters) {
            if (param.name && ts.isIdentifier(param.name)) {
              scopedIdentifiers.push([param.name.text, localScope]);
            }
          }
        }

        let nextVisitor = visit;
        // next, we want to create a new scope for any block
        if (ts.isBlock(node)) {
          nextVisitor = makeDeclarationVisitor([...scope, counter++]);
        }

        return ts.visitEachChild(node, nextVisitor, context);
      };
      return visit;
    };

    void ts.visitNode(sourceFile, makeDeclarationVisitor([]));

    // sort the identifier list by the length of the scope path, descending
    // this way, we go from most precise to least precise scope
    scopedIdentifiers.sort((a, b) => b[1].length - a[1].length);

    // we reset this counter for the next pass, to match the scope path
    counter = 0;
    const makeIdentifierVisitor = (scope: number[]) => {
      const visit: ts.Visitor = (node) => {
        // the localScope is a temporary variable that we use to update the
        // scope path for only this scope, and not the children scopes.
        let localScope = [...scope];

        // for parameters, we anticipate a new scope
        if (node.parent && ts.isParameter(node.parent)) {
          localScope = [...localScope, counter];
        }

        if (
          ts.isIdentifier(node) &&
          // we don't want to rename property access expressions
          !(
            node.parent &&
            ts.isPropertyAccessExpression(node.parent) &&
            node.parent.name === node
          )
        ) {
          const resolved = resolveIdentifier(
            scopedIdentifiers,
            node.text,
            localScope
          );
          if (resolved) {
            return resolved;
          }
        }

        let nextVisitor = visit;
        if (ts.isBlock(node)) {
          // create a new map for the new scope
          nextVisitor = makeIdentifierVisitor([...scope, counter++]);
        }

        return ts.visitEachChild(node, nextVisitor, context);
      };
      return visit;
    };
    return ts.visitNode(sourceFile, makeIdentifierVisitor([]));
  };
};

// NOTE: These types come from typedef_gen.rs
type FieldInfo =
  | { type: string; id: string }
  | { type: string; id: string; fields: FieldInfo[] };

type ParamsType = { [name: string]: FieldInfo[] | null };

type FuncInfo = {
  params: ParamsType;
  ret: FieldInfo[] | null;
};

type ObjectInfoMap = { [name: string]: FuncInfo };

export const objectInfo = (sourceFile: ts.SourceFile): ObjectInfoMap => {
  // TODO: remove test code

  // function f(obj) {
  //   obj.a;
  //   obj.b;
  //   obj.m();
  //   obj.d.a;
  // }

  let transformed = ts.transform(sourceFile, [alphaRenameTransformer])
    .transformed[0];
  let printed = codePrinter.printFile(transformed);
  console.error(printed);

  const obj_a = {
    type: "field",
    id: "a",
  };
  const obj_b = {
    type: "field",
    id: "b",
  };

  const obj_m_call = {
    type: "call",
    id: "m",
  };

  const obj_d_a = {
    type: "object",
    id: "d",
    fields: [obj_a],
  };

  const params: ParamsType = {};
  params["obj"] = [obj_a, obj_b, obj_m_call, obj_d_a];

  const funcinfo = {
    params: params,
    ret: null,
  };

  const objectInfoMap: ObjectInfoMap = {};
  objectInfoMap["f"] = funcinfo;

  return objectInfoMap;
};
