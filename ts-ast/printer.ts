import ts from "typescript";
import { codePrinter } from "./main";

const createFakeType = (): ts.TypeReferenceNode => {
  return ts.createTypeReferenceNode(ts.createIdentifier("***"), undefined);
};

const traverse = (child: ts.Node) => {
  if (child.kind === ts.SyntaxKind.FunctionDeclaration) {
    const functionDeclaration = child as ts.FunctionDeclaration;
    functionDeclaration.type = functionDeclaration.type
      ? functionDeclaration.type
      : createFakeType();
    functionDeclaration.parameters.forEach((parameter) => {
      parameter.type = parameter.type ? parameter.type : createFakeType();
    });
  }

  if (child.kind === ts.SyntaxKind.VariableStatement) {
    const variableStatement = child as ts.VariableStatement;
    variableStatement.declarationList.declarations.forEach((declaration) => {
      declaration.type = declaration.type ? declaration.type : createFakeType();
    });
  }

  ts.forEachChild(child, traverse);
};

export const printSource = (sourceFile: ts.SourceFile): string => {
  sourceFile.forEachChild((child) => {
    traverse(child);
  });

  // Print the new code
  return codePrinter.printFile(sourceFile);
};
