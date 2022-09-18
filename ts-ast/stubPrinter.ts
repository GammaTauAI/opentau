import ts from "typescript";
import { printSource } from "./printer";

export const stubString = (sourceFile: ts.SourceFile): string => {
  const traverse = (child: ts.Node, level: number) => {
    if (level > 0) {
      if (child.kind === ts.SyntaxKind.FunctionDeclaration) {
        const func = child as ts.FunctionDeclaration;
        func.body = undefined;
      }
    }
    child.forEachChild((c) => traverse(c, level + 1));
  };

  sourceFile.forEachChild((child) => traverse(child, 0));
  return printSource(sourceFile);
};
