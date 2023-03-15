import ts from "typescript";
import { codePrinter } from "./utils";

type CodeBlockTree = {
  name: string; // NOTE: this is symgen'd
  code: string;
  children: CodeBlockTree[];
};

// returns true if the given node can include a type annotation
// this is not exhaustive, only used for makeTree edge cases
const isTypable = (node: ts.Node) => {
  const isFuncAndHasBody = (node: ts.Node) => {
    if (
      node.kind === ts.SyntaxKind.FunctionExpression ||
      node.kind === ts.SyntaxKind.ArrowFunction
    ) {
      const func = node as ts.FunctionExpression;
      if (func.body.kind === ts.SyntaxKind.Block) {
        return true;
      }

      return false;
    }
  };
  return (
    (ts.isVariableDeclaration(node) &&
      !(node.initializer && isFuncAndHasBody(node.initializer))) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isFunctionLike(node)
  );
};

export const makeTree = (sourceFile: ts.SourceFile): CodeBlockTree => {
  const usedRandomNumbers = new Set();
  const symgen = (prefix: string) => {
    let n = 0;
    while (usedRandomNumbers.has(n)) {
      n = Math.floor(Math.random() * 1000000);
    }
    usedRandomNumbers.add(n);
    return prefix + "$" + n;
  };

  const traverse = (
    child: ts.Node,
    ctxParentNode: CodeBlockTree,
    atTop = false
  ) => {
    // skip FirstStatement, EndOfFileToken
    // we want the children of these nodes to simplify the search
    if (
      child.kind === ts.SyntaxKind.FirstStatement ||
      child.kind === ts.SyntaxKind.EndOfFileToken ||
      child.kind === ts.SyntaxKind.VariableDeclarationList
    ) {
      child.forEachChild((child) => traverse(child, ctxParentNode, atTop));
      return;
    }

    const generateCode = (node: ts.Node) => {
      const code = codePrinter.printNode(
        ts.EmitHint.Unspecified,
        node,
        sourceFile
      );
      return code;
    };

    // function declarations
    if (ts.isFunctionDeclaration(child) && child.name) {
      // idk why, but sometimes a func doesn't have a name, but it's not necessarily an anonymous function
      const name = symgen(child.name.escapedText.toString());
      let thisNode = { name, code: generateCode(child), children: [] };

      child.body?.statements.forEach((child) => traverse(child, thisNode));

      ctxParentNode.children.push(thisNode);

      return;
    } else if (
      (ts.isFunctionExpression(child) || ts.isArrowFunction(child)) &&
      child.parent &&
      ts.isVariableDeclaration(child.parent)
    ) {
      // check if parent is a variable declaration
      const func = child as ts.FunctionExpression;
      const varDec = child.parent as ts.VariableDeclaration;
      const code = generateCode(varDec.parent);
      const nameId = varDec.name as ts.Identifier;
      const name = symgen(nameId.escapedText.toString());
      let thisNode = { name, code, children: [] };

      if (func.body.statements) {
        func.body?.statements.forEach((child) => traverse(child, thisNode));
        ctxParentNode.children.push(thisNode);
        return;
      }
    } else if (ts.isClassDeclaration(child) && child.name) {
      const name = symgen(child.name.escapedText.toString());
      let thisNode = { name, code: generateCode(child), children: [] };

      child.members.forEach((child) => traverse(child, thisNode));

      ctxParentNode.children.push(thisNode);

      return;
    } else if (atTop && isTypable(child)) {
      console.log("top level", ts.SyntaxKind[child.kind]);
      // toplevel node, make a child
      const name = symgen("topnode");
      let code;
      if (ts.isVariableDeclaration(child)) {
        code = generateCode(child.parent);
      } else {
        code = generateCode(child);
      }
      let thisNode = { name, code, children: [] };
      ctxParentNode.children.push(thisNode);
    }

    child.forEachChild((child) => {
      traverse(child, ctxParentNode);
    });

    return;
  };

  let tree: CodeBlockTree = {
    // NOTE: the & is to make sure we don't have a name collision with some other function
    name: "&root$",
    code: codePrinter.printFile(sourceFile),
    children: [],
  };

  ts.forEachChild(sourceFile, (child) => {
    traverse(child, tree, true);
  });

  return tree;
};
