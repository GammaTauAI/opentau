import ts from "typescript";
import { printSource } from "./printer";
import { codePrinter } from "./main";

export const stubSource = (sourceFile: ts.SourceFile): string => {
  const traverse = (child: ts.Node, level: number) => {
    const code = codePrinter.printNode(
      ts.EmitHint.Unspecified,
      child,
      sourceFile
    );
    console.log("level: ", level);
    console.log("kind: ", child.kind);
    console.log("code: ", code);

    // for arrowfunc/funcexpr we ask for five levels because:
    // - first nesting is var type (let, const, var)
    // - second nesting is var decl list
    // - third nesting is var decl in the previous list
    // - fourth nesting is the name of the var decl
    // - finally, fifth nesting is the actual function expression
    if (level > 3) {
      if (
        (child.kind === ts.SyntaxKind.ArrowFunction ||
          child.kind === ts.SyntaxKind.FunctionExpression) &&
        // also check if parent is a variable declaration
        child.parent?.kind === ts.SyntaxKind.VariableDeclaration
      ) {
        let func = child as ts.FunctionExpression;
        func.body = ts.createBlock([]); // TODO: does codex think that it needs to fill in here?
      }
      // normal function declarations are more sane, only one level
    } else if (level > 0) {
      if (child.kind === ts.SyntaxKind.FunctionDeclaration) {
        const func = child as ts.FunctionDeclaration;
        func.body = undefined;
      } else if (child.kind === ts.SyntaxKind.MethodDeclaration) {
        const func = child as ts.MethodDeclaration;
        func.body = undefined;
      }
    }
    child.forEachChild((c) => traverse(c, level + 1));
  };

  sourceFile.forEachChild((child) => traverse(child, 0));
  return printSource(sourceFile);
};
