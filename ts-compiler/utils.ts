import ts from "typescript";

// unions two sets into a new set
export const setUnion = <T>(a: Set<T>, b: Set<T>): Set<T> => {
  return new Set([...a, ...b]);
};

// prints to console.error, omit parent property
export const printNodeToStderr = (node: ts.Node) => {
  console.error(
    JSON.stringify(
      node,
      (key, value) => {
        if (key === "parent") {
          return undefined;
        }
        return value;
      },
      2
    )
  );
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
  visitor: (
    ty: ts.TypeNode | undefined,
    inner_child: ts.Node
  ) => ts.TypeNode | undefined
) => {
  if (ts.isFunctionDeclaration(child)) {
    child.type = visitor(child.type, child); // NOTE: return type
    child.parameters.forEach((parameter) => {
      parameter.type = visitor(parameter.type, parameter);
    });
  } else if (ts.isMethodDeclaration(child)) {
    child.type = visitor(child.type, child);
    child.parameters.forEach((parameter) => {
      parameter.type = visitor(parameter.type, parameter);
    });
  } else if (ts.isPropertyDeclaration(child)) {
    child.type = visitor(child.type, child);
  } else if (ts.isVariableStatement(child)) {
    child.declarationList.declarations.forEach((declaration) => {
      declaration.type = visitor(declaration.type, declaration);
    });
  } else if (ts.isPropertySignature(child)) {
    child.type = visitor(child.type, child);
  } else if (ts.isFunctionTypeNode(child)) {
    child.parameters.forEach((parameter) => {
      parameter.type = visitor(parameter.type, parameter);
    });
    child.type = visitor(child.type, child) ?? child.type;
  }

  child.forEachChild((c) => typeTraversal(c, visitor));
};
