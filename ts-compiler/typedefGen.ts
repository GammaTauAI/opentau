import ts from "typescript";
import { objectInfo } from "./objectInfo";
import { codePrinter } from "./utils";

// NOTE: assumes that the source file is alphaRenamed. This pass removes the alphaRenaming
// and returns the original names.
export const typedefGen = (sourceFile: ts.SourceFile): string => {
  const objMap = objectInfo(sourceFile);
  return codePrinter.printFile(sourceFile);
};
