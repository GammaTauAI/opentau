import ts from "typescript";
import { typeTraversal } from "./printer";

const count_nodes = (child: ts.Node): number => {
  let count = 1;
  child.forEachChild((c) => {
    count += count_nodes(c);
  });
  return count;
};

export const checkCompleted = (original: ts.SourceFile): boolean => {
  let completed = true;
  original.forEachChild((child) => {
    typeTraversal(child, (ty) => {
      if (ty && ty.kind === ts.SyntaxKind.TypeReference) {
        const typeReference = ty as ts.TypeReferenceNode;
        if (typeReference.typeName.getText() === "_hole_") {
          completed = false;
        }
      }
      return ty;
    });
  });
  if (!completed) {
    return false;
  }

  // TODO: strip types off completed, then check number of nodes

  return completed;
};
