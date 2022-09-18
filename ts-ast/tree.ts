import ts from "typescript";

type CodeBlockTree = {
  name: string;
  code: string;
  children: CodeBlockTree[];
};

export const makeTree = (sourceFile: ts.SourceFile): CodeBlockTree => {
  // create the printer, TODO: make into a singleton
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
    omitTrailingSemicolon: false,
  });

  // TODO: add these
  // - classes
  // - methods
  // - arrow functions
  const traverse = (child: ts.Node, ctxNode: CodeBlockTree): void => {
    const code = printer.printNode(ts.EmitHint.Unspecified, child, sourceFile);

    // only make children out of function declarations
    if (child.kind === ts.SyntaxKind.FunctionDeclaration) {
      const func = child as ts.FunctionDeclaration;
      if (func.name) { // ignore anon functions, TODO: maybe we should include them?
        const name = func.name.escapedText.toString();
        console.log("func name: ", name);

        let thisNode = { name, code, children: [] };

        func.body?.statements.forEach((child) => traverse(child, thisNode));

        if (ctxNode) {
          ctxNode.children.push(thisNode);
        }

        return;
      }
    }

    child.forEachChild((child) => {
      traverse(child, ctxNode);
    });

    return;
  };

  let tree: CodeBlockTree = {
    // NOTE: the & is to make sure we don't have a name collision with some other function
    name: "&root$",
    code: printer.printFile(sourceFile),
    children: [],
  };

  ts.forEachChild(sourceFile, (child) => {
    traverse(child, tree);
  });

  return tree;
};