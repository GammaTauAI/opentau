import ts from "typescript";
import {
  codePrinter,
  createFakeType,
  isVarDeclBoundFunction,
  typeTraversal,
} from "./utils";

// from langserver.rs in the Rust client
export type AnnotateType =
  | "VarDecl"
  | "FuncDecl"
  | "FuncExpr"
  | "ClassProp"
  | "ClassMethod"
  | "TypeDecl";
export const allTypes: AnnotateType[] = [
  "VarDecl",
  "FuncDecl",
  "FuncExpr",
  "ClassProp",
  "ClassMethod",
  "TypeDecl",
];

export const printSource = (
  sourceFile: ts.SourceFile,
  typeName: string,
  annotateTypes: AnnotateType[]
): string => {
  console.log(annotateTypes);
  // Update the source file statements
  sourceFile.forEachChild((child) => {
    typeTraversal(
      child,
      (ty, node) => {
        if (ty) {
          // we have a type already, we don't want to change it
          return ty;
        } else {
          // the type is undefined, so we need to create a fake type

          // in the case of a variable declaration, we need to check if the expression
          // is an arrow function or function expression. so that we can create
          // a fake type that is designed for that
          if (isVarDeclBoundFunction(node) && annotateTypes.includes("FuncExpr")) {
            const declaration = node as ts.VariableDeclaration;
            const aFunc = // same as function expression
              declaration.initializer as ts.ArrowFunction;

            // get the arguments
            aFunc.parameters.map((p) => {
              p.type = p.type ?? createFakeType(typeName);
            });

            aFunc.type = aFunc.type ?? createFakeType(typeName);

            // NOTE: remember, this is the vardecl, not the function,
            // we want to keep the vardecl type as undefined in this case
            return ty;
          }

          // for any other kind of type, we just straight up create a fake type
          return createFakeType(typeName);
        }
      },
      annotateTypes
    );
  });

  // Print the new code
  return codePrinter.printFile(sourceFile);
};
