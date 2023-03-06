import ts from "typescript";
import { objectInfo } from "./objectInfo";
import { codePrinter } from "./utils";

// NOTE: assumes that the source file is alphaRenamed. This pass removes the alphaRenaming
// and returns the original names.
export const typedefGen = (sourceFile: ts.SourceFile): string => {
  const objMap = objectInfo(sourceFile);
  // print objMap
  console.log("objMap: ", objMap);
  // print the keys of the map to the console
  console.log("Keys of the map: ", Object.keys(objMap));
  return codePrinter.printFile(sourceFile);
};

// TODO: remove this
const loadFile = (fileName: string): ts.SourceFile => {
  const program = ts.createProgram([fileName], {});
  const sourceFile = program.getSourceFile(fileName);
  if (!sourceFile) {
    throw new Error("Source file not found");
  }
  return sourceFile;
};

// test this
const sourceFile = loadFile("../utils/testfiles/defgen/medium.ts");
typedefGen(sourceFile);
