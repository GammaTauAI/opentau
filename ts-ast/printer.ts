import ts from "typescript";
import { codePrinter, createFakeType, typeTraversal } from "./utils";

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
