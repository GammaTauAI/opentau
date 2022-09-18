import ts from "typescript";
import { printSource } from "./printer";

export const stubSource = (sourceFile: ts.SourceFile): string => {
  const traverse = (child: ts.Node, level: number) => {
    if (level > 0) {
      if (child.kind === ts.SyntaxKind.FunctionDeclaration) {
        const func = child as ts.FunctionDeclaration;
        func.body = undefined;
      } else if (child.kind === ts.SyntaxKind.ArrowFunction) {
        let func = child as ts.ArrowFunction;
        func.body = ts.createBlock([]); // TODO: does codex think that it needs to fill in here?
      } else if (child.kind === ts.SyntaxKind.MethodDeclaration) {
        const func = child as ts.MethodDeclaration;
        func.body = undefined;
      }
    }
    child.forEachChild((c) => traverse(c, level + 1));
  };

  sourceFile.forEachChild((child) => traverse(child, 0));
  return printSource(sourceFile);
};
