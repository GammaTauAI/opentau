import ts from "typescript";
import { codePrinter } from "./main";

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
export const weaveProgram = (
  original: ts.Program,
  originalPath: string, // the path of the original file
  nettle: ts.Program,
  nettlePath: string, // filepath of the nettle temp file
  nettleLevel: number // the level of the nettle in the tree, 0 is the root.
): string => {
  const sourceFile = original.getSourceFile(originalPath)!;
  const nettleFile = nettle.getSourceFile(nettlePath)!;
  const sourceChecker = original.getTypeChecker();
  const nettleChecker = nettle.getTypeChecker();

  // we want a map of identifier names to types, such that we can transplant
  // the types from the nettle AST to the original AST
  const typeMap = new Map<string, ts.TypeNode>();

  function buildTypeMap(node: ts.Node, scope: string) {
    if (ts.isVariableDeclaration(node)) {
      console.log("VAAAAAAAAAAAAAAAAAAAR");
      const type = nettleChecker.getTypeAtLocation(node);
      const name = node.name.getText();
      typeMap.set(scope + name, nettleChecker.typeToTypeNode(type)!);
    } else if (ts.isFunctionDeclaration(node)) {
      const type = nettleChecker.getTypeAtLocation(node);
      console.log("FUNNNNNNNNNNNNNNNC");
      const name = node.name!.getText();
      typeMap.set(scope + name, nettleChecker.typeToTypeNode(type)!);
      // we change the scope
      ts.forEachChild(node, (child) => buildTypeMap(child, scope + name + "$"));
      return;
    }
    ts.forEachChild(node, (child) => buildTypeMap(child, scope));
  }

  nettleFile.forEachChild((child) => buildTypeMap(child, ""));
  console.log("typeMap keys:", typeMap.keys());

  // we weave the types into the original AST
  function weaveNode(node: ts.Node, scope: string) {
    if (ts.isVariableDeclaration(node)) {
      const varDecl = node as ts.VariableDeclaration;
      const name = varDecl.name.getText();
      const type = typeMap.get(scope + name);
      if (type) {
        varDecl.type = type;
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
      // we change the scope
      ts.forEachChild(node, (child) => weaveNode(child, scope + name + "$"));
      return;
    }
    ts.forEachChild(node, (child) => weaveNode(child, scope));
  }

  sourceFile.forEachChild((child) => weaveNode(child, ""));

  const code = codePrinter.printFile(sourceFile);
  console.log("code:", code);

  return code;
};
