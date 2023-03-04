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
        // we have a type already, we don't want to change it
        return ty;
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
            const aFunc = // same as function expression
              declaration.initializer as ts.ArrowFunction;

            // get the arguments
            const parameters = aFunc.parameters;
            const parameterTypes = parameters.map((p) => {
              const paramName = codePrinter.printNode(
                ts.EmitHint.Unspecified,
                p.name,
                sourceFile
              );
              const paramType = codePrinter.printNode(
                ts.EmitHint.Unspecified,
                p.type !== undefined ? p.type : createFakeType(typeName),
                sourceFile
              );
              return `${paramName}: ${paramType}`;
            });
            const parameterString = parameterTypes.join(", ");
            const returnTypeString = codePrinter.printNode(
              ts.EmitHint.Unspecified,
              aFunc.type !== undefined ? aFunc.type : createFakeType(typeName),
              sourceFile
            );
            const fullType = `(${parameterString}) => ${returnTypeString}`;
            return ts.createTypeReferenceNode(
              ts.createIdentifier(fullType),
              undefined
            );
          }
        }

        // for any other kind of type, we just straight up create a fake type
        return createFakeType(typeName);
      }
    });
  });

  // Print the new code
  return codePrinter.printFile(sourceFile);
};
