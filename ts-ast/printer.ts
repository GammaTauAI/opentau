import ts from "typescript";
import { codePrinter } from "./main";

export const createFakeType = (id: string): ts.TypeReferenceNode => {
  return ts.createTypeReferenceNode(ts.createIdentifier(id), undefined);
};

export const typeTraversal = (
  child: ts.Node,
  func: (
    ty: ts.TypeNode | undefined,
    inner_child: ts.Node
  ) => ts.TypeNode | undefined
) => {
  if (child.kind === ts.SyntaxKind.FunctionDeclaration) {
    const functionDeclaration = child as ts.FunctionDeclaration;
    functionDeclaration.type = func(functionDeclaration.type, child);
    functionDeclaration.parameters.forEach((parameter) => {
      parameter.type = func(parameter.type, parameter);
    });
  }

  if (child.kind === ts.SyntaxKind.MethodDeclaration) {
    const methodDeclaration = child as ts.MethodDeclaration;
    methodDeclaration.type = func(methodDeclaration.type, child);
    methodDeclaration.parameters.forEach((parameter) => {
      parameter.type = func(parameter.type, parameter);
    });
  }

  if (child.kind === ts.SyntaxKind.PropertyDeclaration) {
    const propertyDeclaration = child as ts.PropertyDeclaration;
    propertyDeclaration.type = func(propertyDeclaration.type, child);
  }

  if (child.kind === ts.SyntaxKind.VariableStatement) {
    const variableStatement = child as ts.VariableStatement;
    variableStatement.declarationList.declarations.forEach((declaration) => {
      declaration.type = func(declaration.type, declaration);
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
    typeTraversal(child, (ty, node) => {
      if (ty) {
        if (ty.kind === ts.SyntaxKind.TypeReference) {
          const typeReference = ty as ts.TypeReferenceNode;
          if (
            typeReference.typeName.getText(sourceFile) === "_hole_" &&
            typeName != "_hole_"
          ) {
            return createFakeType(typeName);
          }
        } else {
          return ty;
        }
      } else {
        // the type is undefined, so we need to create a fake type

        // in the case of a variable declaration, we need to check if the expression
        // is an arrow function or function expression. so that we can create
        // a fake type that is designed for that
        if (node.kind === ts.SyntaxKind.VariableDeclaration) {
          const declaration = node as ts.VariableDeclaration;
          if (
            declaration.initializer &&
            (declaration.initializer.kind === ts.SyntaxKind.ArrowFunction ||
              declaration.initializer.kind === ts.SyntaxKind.FunctionExpression)
          ) {
            console.error("function expression");
            console.error(declaration.initializer.getText(sourceFile));
            // get the arguments
            const arrowFunction = // same as function expression
              declaration.initializer as ts.ArrowFunction;
            const parameters = arrowFunction.parameters;
            const parameterTypes = parameters.map((p) => {
              const paramName = codePrinter.printNode(
                ts.EmitHint.Unspecified,
                p.name,
                sourceFile
              );
              const fakeType = codePrinter.printNode(
                ts.EmitHint.Unspecified,
                createFakeType(typeName),
                sourceFile
              );
              return `${paramName}: ${fakeType}`;
            });
            const parameterString = parameterTypes.join(", ");
            const returnType = createFakeType(typeName);
            const returnTypeString = codePrinter.printNode(
              ts.EmitHint.Unspecified,
              returnType,
              sourceFile
            );
            const fakeType = `(${parameterString}) => ${returnTypeString}`;
            return ts.createTypeReferenceNode(
              ts.createIdentifier(fakeType),
              undefined
            );
          }
        }
        return createFakeType(typeName);
      }
    });
  });

  // Print the new code
  return codePrinter.printFile(sourceFile);
};
