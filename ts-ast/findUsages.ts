import ts from "typescript";
import { codePrinter } from "./main";

export const findUsages = (
  outerBlock: ts.SourceFile,
  innerBlock: ts.SourceFile
): string => {
  const usagesStmts: ts.Statement[] = [];

  // finds the first identifier in the inner block
  // TODO: do alpha-renaming, maybe borrow from the type-weaving code?
  const identFinder = (node: ts.Node): ts.Identifier | undefined => {
    if (ts.isIdentifier(node)) {
      return node;
    }

    return ts.forEachChild(node, identFinder);
  };

  const ident = identFinder(innerBlock);

  if (!ident) {
    return "";
  }

  // find all usages of the identifier in the outer block, and append them to the usagesStmts
  // skipping the first one (which is the declaration)
  const usageFinder = (node: ts.Node): void => {
    // checks if the parent of this id is some sort of declaration
    const isDecl = (id: ts.Identifier): boolean => {
      return (
        ts.isVariableDeclaration(id.parent) ||
        ts.isFunctionDeclaration(id.parent) ||
        ts.isMethodDeclaration(id.parent) ||
        ts.isClassDeclaration(id.parent)
      );
    };

    const inner = (node: ts.Node): void => {
      if (ts.isIdentifier(node) && node.text === ident?.text) {
        if (!isDecl(node)) {
          // go up the tree until we find a statement
          var stmt = node.parent;
          while (
            stmt &&
            stmt.parent &&
            (ts.isCallLikeExpression(stmt.parent) ||
              ts.isBinaryExpression(stmt.parent) ||
              ts.isPropertyAccessExpression(stmt.parent) ||
              ts.isElementAccessExpression(stmt.parent) ||
              ts.isPrefixUnaryExpression(stmt.parent) ||
              ts.isPostfixUnaryExpression(stmt.parent) ||
              ts.isNewExpression(stmt.parent))
          ) {
            stmt = stmt.parent;
          }

          usagesStmts.push(ts.createExpressionStatement(stmt as ts.Expression));
        } else {
          // we don't want to add the declaration to the usages
          return;
        }
      }

      ts.forEachChild(node, inner);
    };
    inner(node);
  };

  usageFinder(outerBlock);

  if (usagesStmts.length === 0) {
    return "";
  }

  const usagesStr = codePrinter.printList(
    ts.ListFormat.MultiLine,
    ts.createNodeArray(usagesStmts),
    outerBlock
  );

  const prelude = "// Usages of '" + ident?.text + "' are shown below:\n";
  return prelude + usagesStr;
};
