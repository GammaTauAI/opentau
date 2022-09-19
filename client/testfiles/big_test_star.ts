import ts from "typescript";
import * as fs from "fs";
// Create a Printer
const printer: *** = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
    omitTrailingSemicolon: true,
});
// get argv[1]
const fileName: *** = process.argv[2];
if (!fileName) {
    throw new Error("No file name provided");
}
// Create a source file
const sourceFile: *** = ts.createSourceFile("someFileName.ts", // name does not matter until we save, which we don't from here
fs.readFileSync(fileName, "utf8"), // source file
ts.ScriptTarget.Latest, 
/*setParentNodes*/ false, ts.ScriptKind.TS);
// NOTE: ok so the generalization could be:
//  - we spin up a server, takes in the printed source code
//  - we get a start token (in this case "/*") and and end token (in this case "*/"), where inside those
//    there needs to be a "fake-type" identifier
//  - then we give stuff to codex
function createFakeType(): ts.TypeReferenceNode {
    return ts.createTypeReferenceNode(ts.createIdentifier("***"), undefined);
}
// Update the source file statements
function traverse(child: ts.Node): *** {
    if (child.kind === ts.SyntaxKind.FunctionDeclaration) {
        const functionDeclaration: *** = child as ts.FunctionDeclaration;
        functionDeclaration.type = functionDeclaration.type ? functionDeclaration.type : createFakeType();
        functionDeclaration.parameters.forEach((parameter) => {
            parameter.type = parameter.type ? parameter.type : createFakeType();
        });
    }
    if (child.kind === ts.SyntaxKind.VariableStatement) {
        const variableStatement: *** = child as ts.VariableStatement;
        variableStatement.declarationList.declarations.forEach((declaration) => {
            declaration.type = declaration.type ? declaration.type : createFakeType();
        });
    }
    ts.forEachChild(child, traverse);
}
sourceFile.forEachChild((child) => {
    traverse(child);
});
// Print the new code
console.log(printer.printFile(sourceFile));

