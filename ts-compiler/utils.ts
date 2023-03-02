import ts from "typescript";

// unions two sets into a new set
export const setUnion = <T>(a: Set<T>, b: Set<T>): Set<T> => {
  return new Set([...a, ...b]);
};

// prints to console.error, omit parent property
export const printNodeToStderr = (node: ts.Node) => {
  console.error(JSON.stringify(node, (key, value) => {
    if (key === "parent") {
      return undefined;
    }
    return value;
  }, 2));
};

// the global printer object!
export const codePrinter = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  removeComments: false,
  omitTrailingSemicolon: false,
});

// checks if the given node is an assignment expression (the one with the = sign)
export const isAssignmentExpression = (
  node: ts.Node
): node is ts.AssignmentExpression<ts.EqualsToken> => {
  return (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.EqualsToken
  );
};

// the normal getChildren() function is broken an crashes at CallExpressions...
// i cannot believe i actually have to do this.
export const getChildrenFixed = (node: ts.Node): ts.Node[] => {
  const children: ts.Node[] = [];
  node.forEachChild((child) => {
    children.push(child);
  });
  return children;
};

export const createFakeType = (id: string): ts.TypeReferenceNode => {
  return ts.createTypeReferenceNode(ts.createIdentifier(id), undefined);
};

export const typeTraversal = (
  child: ts.Node,
  func: (
    ty: ts.TypeNode | undefined,
    inner_child: ts.Node
  ) => ts.TypeNode | undefined
) => {
  if (child.kind === ts.SyntaxKind.FunctionDeclaration) {
    const functionDeclaration = child as ts.FunctionDeclaration;
    functionDeclaration.type = func(functionDeclaration.type, child);
    functionDeclaration.parameters.forEach((parameter) => {
      parameter.type = func(parameter.type, parameter);
    });
  }

  if (child.kind === ts.SyntaxKind.MethodDeclaration) {
    const methodDeclaration = child as ts.MethodDeclaration;
    methodDeclaration.type = func(methodDeclaration.type, child);
    methodDeclaration.parameters.forEach((parameter) => {
      parameter.type = func(parameter.type, parameter);
    });
  }

  if (child.kind === ts.SyntaxKind.PropertyDeclaration) {
    const propertyDeclaration = child as ts.PropertyDeclaration;
    propertyDeclaration.type = func(propertyDeclaration.type, child);
  }

  if (child.kind === ts.SyntaxKind.VariableStatement) {
    const variableStatement = child as ts.VariableStatement;
    variableStatement.declarationList.declarations.forEach((declaration) => {
      declaration.type = func(declaration.type, declaration);
    });
  }

  child.forEachChild((c) => typeTraversal(c, func));
};
