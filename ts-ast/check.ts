import ts from "typescript";
import { typeTraversal, createFakeType } from "./printer";
import { codePrinter } from "./main";

const count_nodes = (child: ts.Node): number => {
  let count = 1;
  child.forEachChild((c) => {
    count += count_nodes(c);
  });
  return count;
};

// gets the number of comments from a source file. both trailing and leading
const get_comments = (s: ts.SourceFile): number => {
  let count = 0;
  const leading = ts.getLeadingCommentRanges(s.getFullText(), 0);
  const trailing = ts.getTrailingCommentRanges(s.getFullText(), 0);
  if (leading) {
    count += leading.length;
  }
  if (trailing) {
    count += trailing.length;
  }
  return count;
};

export const checkCompleted = (
  original: ts.SourceFile,
  completed: ts.SourceFile
): [boolean, number] => {
  let isCompleted = true;
  let score = 0;
  // checks completed types and scores them
  completed.forEachChild((child) => {
    typeTraversal(child, (ty) => {
      // means codex removed the type
      if (!ty) {
        isCompleted = false;
        return ty;
      }

      const tyString = codePrinter
        .printNode(ts.EmitHint.Unspecified, ty, completed)
        .trim();

      if (tyString.includes("_hole_")) {
        isCompleted = false;
      } else if (tyString.includes("any")) {
        score += 5;
      } else if (tyString.includes("unknown")) {
        score += 3;
      } else if (tyString.includes("undefined")) {
        score += 2;
      }

      return ty;
    });
  });

  // short circuit if not completed
  if (!isCompleted) {
    return [false, score];
  }

  // now, strip types out of the original and completed
  const originalStripped = ts.getMutableClone(original);
  const completedStripped = ts.getMutableClone(completed);

  // check if it added any weird comments
  let originalComments = get_comments(originalStripped);
  let completedComments = get_comments(completedStripped);

  // short circuit if it added comments
  if (originalComments !== completedComments) {
    return [false, score];
  }

  // now strip types
  const stripTypes = (_: ts.TypeNode | undefined): ts.TypeNode =>
    createFakeType("bleh"); // does not matter what we return here

  originalStripped.forEachChild((child) => {
    typeTraversal(child, stripTypes);
  });
  completedStripped.forEachChild((child) => {
    typeTraversal(child, stripTypes);
  });

  // now, compare the number of nodes in the original and completed
  const originalCount = count_nodes(originalStripped);
  const completedCount = count_nodes(completedStripped);

  return [originalCount === completedCount, score];
};
