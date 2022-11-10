import ts from "typescript";
import { codePrinter } from "./main";

type CodeBlockTree = {
  name: string; // NOTE: this is symgen'd
  code: string;
  children: CodeBlockTree[];
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

  const traverse = (child: ts.Node, ctxParentNode: CodeBlockTree): void => {
    const code = codePrinter.printNode(
      ts.EmitHint.Unspecified,
      child,
      sourceFile
    );

    // function declarations
    if (child.kind === ts.SyntaxKind.FunctionDeclaration) {
      const func = child as ts.FunctionDeclaration;
      // idk why, but sometimes a func doesn't have a name, but it's not necessarily an anonymous function
      if (func.name) {
        const name = symgen(func.name.escapedText.toString());
        let thisNode = { name, code, children: [] };

        func.body?.statements.forEach((child) => traverse(child, thisNode));

        ctxParentNode.children.push(thisNode);

        return;
      }
    }

    // console.log("kind: ", child.kind);
    // console.log("code: ", code);

    // arrow funcs / anonymous functions (that are let-bound)
    if (
      child.kind === ts.SyntaxKind.FunctionExpression ||
      child.kind === ts.SyntaxKind.ArrowFunction
    ) {
      // check if parent is a variable declaration
      const func = child as ts.FunctionExpression;
      if (child.parent?.kind === ts.SyntaxKind.VariableDeclaration) {
        const varDec = child.parent as ts.VariableDeclaration;
        const code = codePrinter.printNode(
          ts.EmitHint.Unspecified,
          varDec.parent, // go another level up
          sourceFile
        );
        const nameId = varDec.name as ts.Identifier;
        const name = symgen(nameId.escapedText.toString());
        let thisNode = { name, code, children: [] };

        if (func.body.statements) {
          func.body?.statements.forEach((child) => traverse(child, thisNode));
          ctxParentNode.children.push(thisNode);
          return;
        }
      }
    }

    // classes
    if (child.kind === ts.SyntaxKind.ClassDeclaration) {
      const classDec = child as ts.ClassDeclaration;
      if (classDec.name) {
        const name = symgen(classDec.name.escapedText.toString());
        let thisNode = { name, code, children: [] };

        classDec.members.forEach((child) => traverse(child, thisNode));

        ctxParentNode.children.push(thisNode);

        return;
      }
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
    traverse(child, tree);
  });

  return tree;
};
