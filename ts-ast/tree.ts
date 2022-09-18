import ts from "typescript";

type CodeBlockTree = {
  name: string;
  code: string;
  children: CodeBlockTree[];
};

export const makeTree = (sourceFile: ts.SourceFile): CodeBlockTree[] => {
  // create the printer, TODO: make into a singleton
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
    omitTrailingSemicolon: false,
  });

  const traverse = (
    child: ts.Node,
    ctxName: string,
    ctxNode: CodeBlockTree | undefined
  ): CodeBlockTree => {
    // only make children out of function declarations
    const code = printer.printNode(ts.EmitHint.Unspecified, child, sourceFile);

    if (child.kind === ts.SyntaxKind.FunctionDeclaration) {
      const func = child as ts.FunctionDeclaration;
      console.log(func.name);
      const name = func.name?.escapedText.toString() ?? "anonymous"; // TODO: handle this case, we don't want to do anon
      console.log("func name: ", name);

      let ctxNode = { name, code, children: [] };

      func.body?.statements.forEach((child) => traverse(child, name, ctxNode));

      return ctxNode;
    }

    if (ctxNode === undefined) {
      return { name: "ctx", code, children: [] };
    }

    child.forEachChild((child2) => {
      traverse(child2, ctxName, ctxNode);
    });

    return ctxNode;
  };

  let forest: CodeBlockTree[] = [];

  ts.forEachChild(sourceFile, (child) => {
    forest.push(traverse(child, "ctx", undefined)); // TODO: undefined?
  });

  return forest;
};
