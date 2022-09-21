import ts from "typescript";
import { typeTraversal, createFakeType } from "./printer";

const count_nodes = (child: ts.Node): number => {
  let count = 1;
  child.forEachChild((c) => {
    count += count_nodes(c);
  });
  return count;
};

export const checkCompleted = (
  original: ts.SourceFile,
  completed: ts.SourceFile
): boolean => {
  let isCompleted = true;
  completed.forEachChild((child) => {
    typeTraversal(child, (ty) => {
      if (ty && ty.kind === ts.SyntaxKind.TypeReference) {
        const typeReference = ty as ts.TypeReferenceNode;
        if (typeReference.typeName.getText(completed) === "_hole_") {
          isCompleted = false;
        }
      }
      return ty;
    });
  });
  if (!completed) {
    return false;
  }

  // now, strip types out of the original and completed
  const originalStripped = ts.getMutableClone(original);
  const completedStripped = ts.getMutableClone(completed);

  const stripTypes = (_: ts.TypeNode | undefined): ts.TypeNode =>
    createFakeType();

  originalStripped.forEachChild((child) => {
    typeTraversal(child, stripTypes);
  });
  completedStripped.forEachChild((child) => {
    typeTraversal(child, stripTypes);
  });

  // now, compare the number of nodes in the original and completed
  const originalCount = count_nodes(originalStripped);
  const completedCount = count_nodes(completedStripped);

  if (originalCount !== completedCount) {
    isCompleted = false;
  }

  // TODO: strip types off completed, then check number of nodes

  return isCompleted;
};
