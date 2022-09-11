import ts from "typescript";

export const stubString = (sourceFile: ts.SourceFile): string => {
  const traverse = (child: ts.Node) => {
    if (child.kind === ts.SyntaxKind.FunctionDeclaration) {
    }
  };

  sourceFile.forEachChild((child) => traverse(child));
};
