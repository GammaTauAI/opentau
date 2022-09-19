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
