import ts from "typescript";
import { codePrinter } from "./main";

// for debugging
const typeMapPrint = (
  typeMap: Map<string, ts.TypeNode>,
  sourceFile: ts.SourceFile
): string => {
  let str = "";
  typeMap.forEach((value, key) => {
    str += `${key}: `;
    str += codePrinter.printNode(ts.EmitHint.Unspecified, value, sourceFile);
    str += "\n";
  });
  return str;
};

// IDEA:
// - what we have:
//  - we have an unwoven, uncompleted AST
//  - we have a woven, completed AST, that also has been stubbed
// - what we want to do:
//  - we want to make a map of the woven AST's types (name of identifier -> type)
//    - NOTE: we don't need alpha-renaming, because there aren't going to be different scopes.
//  - we traverse the unwoven AST, and for each identifier, we look up its type in the map and we replace it with the type
//  - we then print the unwoven AST, after being transformed
//
export const weavePrograms = (
  original: ts.Program,
  originalPath: string, // the path of the original file
  nettle: ts.Program,
  nettlePath: string, // filepath of the temp file
  nettleLevel: number // the level of the nettle in the tree, 0 is the root.
): string => {
  const sourceFile = original.getSourceFile(originalPath)!;
  const nettleFile = nettle.getSourceFile(nettlePath)!;
  original.getTypeChecker();
  const nettleChecker = nettle.getTypeChecker();

  // we want a map of identifier names to types, such that we can transplant
  // the types from the nettle AST to the original AST
  const typeMap = new Map<string, ts.TypeNode>();

  function buildTypeMap(node: ts.Node, scope: string) {
    if (node.kind === ts.SyntaxKind.VariableDeclaration) {
      const varDec = node as ts.VariableDeclaration;
      // if name is not a ident, skip
      // NOTE: we have to be careful, we want to ignore variable decls
      // that are inside a for (let x of y) loop, because those
      // cannot be type annotated.
      // we can do this by checking if the parent of the parent is a for of statement
      if (
        varDec.name.kind === ts.SyntaxKind.Identifier &&
        !(
          node.parent && // we do the check noted above
          node.parent.parent &&
          node.parent.parent.kind === ts.SyntaxKind.ForOfStatement
        )
      ) {
        const type = nettleChecker.getTypeAtLocation(varDec);
        const name = varDec.name.getText();
        typeMap.set(scope + name, nettleChecker.typeToTypeNode(type)!);
      }
    } else if (ts.isPropertyDeclaration(node)) {
      const propDec = node as ts.PropertyDeclaration;
      if (propDec.name.kind === ts.SyntaxKind.Identifier) {
        const type = nettleChecker.getTypeAtLocation(propDec);
        const name = propDec.name.getText();
        typeMap.set(scope + name, nettleChecker.typeToTypeNode(type)!);
      }
    } else if (ts.isFunctionDeclaration(node)) {
      const type = nettleChecker.getTypeAtLocation(node);
      const name = node.name!.getText();
      typeMap.set(scope + name, nettleChecker.typeToTypeNode(type)!);
      // we change the scope
      ts.forEachChild(node, (child) => buildTypeMap(child, scope + name + "$"));
      return;
    } else if (ts.isMethodDeclaration(node)) {
      const type = nettleChecker.getTypeAtLocation(node);
      const name = node.name.getText();
      typeMap.set(scope + name, nettleChecker.typeToTypeNode(type)!);
    } else if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
      // we need some name for the function, so we check for a variable declaration
      if (node.parent?.kind === ts.SyntaxKind.VariableDeclaration) {
        const varDec = node.parent as ts.VariableDeclaration;
        const type = nettleChecker.getTypeAtLocation(varDec);
        const name = varDec.name.getText();
        typeMap.set(scope + name, nettleChecker.typeToTypeNode(type)!);
        // we change the scope
        ts.forEachChild(node, (child) =>
          buildTypeMap(child, scope + name + "$")
        );

        return;
      }
    } else if (ts.isClassDeclaration(node)) {
      // we just want to change the scope
      const name = node.name!.getText();
      ts.forEachChild(node, (child) => buildTypeMap(child, scope + name + "$"));
      return;
    }
    ts.forEachChild(node, (child) => buildTypeMap(child, scope));
  }

  nettleFile.forEachChild((child) => buildTypeMap(child, ""));

  console.log("typeMap:\n" + typeMapPrint(typeMap, nettleFile));

  // we weave the types into the original AST
  function weaveNode(node: ts.Node, scope: string, level: number) {
    if (ts.isVariableDeclaration(node)) {
      const varDecl = node as ts.VariableDeclaration;
      const name = varDecl.name.getText();
      const type = typeMap.get(scope + name);
      if (type) {
        varDecl.type = type;
      }
    } else if (ts.isPropertyDeclaration(node)) {
      const propDecl = node as ts.PropertyDeclaration;
      const name = propDecl.name.getText();
      const type = typeMap.get(scope + name);
      if (type) {
        propDecl.type = type;
      }
    } else if (ts.isFunctionDeclaration(node)) {
      const funcDecl = node as ts.FunctionDeclaration;
      const name = funcDecl.name!.getText();
      const type = typeMap.get(scope + name) as ts.FunctionTypeNode;
      if (type) {
        funcDecl.typeParameters = type.typeParameters;
        funcDecl.parameters = type.parameters;
        funcDecl.type = type.type;
      }
      // we change the scope, if we are at the nettle level
      if (level >= nettleLevel) {
        ts.forEachChild(node, (child) =>
          weaveNode(child, scope + name + "$", level + 1)
        );
        return;
      } else {
        ts.forEachChild(node, (child) => weaveNode(child, scope, level + 1));
        return;
      }
    } else if (ts.isMethodDeclaration(node)) {
      const methodDecl = node as ts.MethodDeclaration;
      const name = methodDecl.name.getText();
      const type = typeMap.get(scope + name) as ts.FunctionTypeNode;
      if (type) {
        methodDecl.typeParameters = type.typeParameters;
        methodDecl.parameters = type.parameters;
        methodDecl.type = type.type;
      }
    } else if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
      // we need some name for the function, so we check for a variable declaration
      if (node.parent?.kind === ts.SyntaxKind.VariableDeclaration) {
        const varDec = node.parent as ts.VariableDeclaration;
        const name = varDec.name.getText();
        const type = typeMap.get(scope + name);
        if (type) {
          varDec.type = type;
        }
        // we change the scope, if we are at the nettle level
        if (level >= nettleLevel) {
          ts.forEachChild(node, (child) =>
            weaveNode(child, scope + name + "$", level + 1)
          );
          return;
        } else {
          ts.forEachChild(node, (child) => weaveNode(child, scope, level + 1));
          return;
        }
      }
    } else if (ts.isClassDeclaration(node)) {
      // we just want to handle the scope
      const name = node.name!.getText();
      if (level >= nettleLevel) {
        ts.forEachChild(node, (child) =>
          weaveNode(child, scope + name + "$", level + 1)
        );
        return;
      } else {
        ts.forEachChild(node, (child) => weaveNode(child, scope, level + 1));
        return;
      }
    }
    ts.forEachChild(node, (child) => weaveNode(child, scope, level));
  }

  sourceFile.forEachChild((child) => weaveNode(child, "", 0));

  return codePrinter.printFile(sourceFile);
};
