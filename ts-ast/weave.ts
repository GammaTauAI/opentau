import ts from "typescript";
import { codePrinter } from "./main";

// IDEA:
// - what we have:
//  - we have an unwoven, uncompleted AST
//  - we have a woven, completed AST, that also has been stubbed
// - what we want to do:
//  - we want to make a map of the woven AST's types (name of identifier -> type)
//    - NOTE: we don't need alpha-renaming, because there aren't going to be different scopes.
//  - we traverse the unwoven AST, and for each identifier, we look up its type in the map and we replace it with the type
//  - we then print the unwoven AST, after being transformed
//
export const weaveSource = (
  original: ts.SourceFile,
  nettle: ts.SourceFile
): string => {
  function weaveNode(node: ts.Node): ts.Node {}
};
