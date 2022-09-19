import ts from "typescript";
import fs from "fs";

const printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  removeComments: false,
  omitTrailingSemicolon: false,
});

const removeComments = (sourceFile: ts.SourceFile) => {
  const newFile: string = sourceFile.fileName + "-nc.js";

  let content: string = "";
  const grabFunc = (child: ts.Node) => {
    if (child.kind === ts.SyntaxKind.FunctionDeclaration) {
    }
  };
};
