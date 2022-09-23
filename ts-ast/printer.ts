import ts from "typescript";
import { codePrinter } from "./main";

export const createFakeType = (id: string): ts.TypeReferenceNode => {
  return ts.createTypeReferenceNode(ts.createIdentifier(id), undefined);
};

export const typeTraversal = (
  child: ts.Node,
  func: (ty: ts.TypeNode | undefined) => ts.TypeNode | undefined
) => {
  if (child.kind === ts.SyntaxKind.FunctionDeclaration) {
    const functionDeclaration = child as ts.FunctionDeclaration;
    functionDeclaration.type = func(functionDeclaration.type);
    functionDeclaration.parameters.forEach((parameter) => {
      parameter.type = func(parameter.type);
    });
  }

  // console.log(ts.SyntaxKind[child.kind]);

  if (child.kind === ts.SyntaxKind.MethodDeclaration) {
    const methodDeclaration = child as ts.MethodDeclaration;
    methodDeclaration.type = func(methodDeclaration.type);
    methodDeclaration.parameters.forEach((parameter) => {
      parameter.type = func(parameter.type);
    });
  }

  if (child.kind === ts.SyntaxKind.PropertyDeclaration) {
    const propertyDeclaration = child as ts.PropertyDeclaration;
    propertyDeclaration.type = func(propertyDeclaration.type);
  }

  if (child.kind === ts.SyntaxKind.VariableStatement) {
    const variableStatement = child as ts.VariableStatement;
    variableStatement.declarationList.declarations.forEach((declaration) => {
      declaration.type = func(declaration.type);
    });
  }

  child.forEachChild((c) => typeTraversal(c, func));
};

export const printSource = (
  sourceFile: ts.SourceFile,
  typeName: string
): string => {
  // Update the source file statements

  sourceFile.forEachChild((child) => {
    typeTraversal(child, (ty) => (ty ? ty : createFakeType(typeName)));
  });

  // Print the new code
  return codePrinter.printFile(sourceFile);
};
