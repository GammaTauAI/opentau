import ts from "typescript";

export const checkCompleted = (original: ts.SourceFile): boolean => {
  console.log("checking completed, original: ", original);
  return true;
};
