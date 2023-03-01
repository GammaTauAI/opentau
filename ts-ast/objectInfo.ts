import assert from "assert";
import ts from "typescript";
import { codePrinter } from "./main";

// checks if it's a declaration that we would like to alpha-rename
function isDeclaration(node: ts.Node): node is ts.NamedDeclaration {
  return (
    ts.isVariableDeclaration(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isClassDeclaration(node)
  );
}

// the normal getChildren() function is broken an crashes at CallExpressions...
// i cannot believe i actually have to do this.
const getChildrenFixed = (node: ts.Node): ts.Node[] => {
  const children: ts.Node[] = [];
  node.forEachChild((child) => {
    children.push(child);
  });
  return children;
};

const isScopedBlock = (node: ts.Node): boolean => {
  return (
    ts.isBlock(node) ||
    ts.isForStatement(node) ||
    ts.isForOfStatement(node) ||
    ts.isForInStatement(node)
  );
};

const recurseCheckNode = (
  node: ts.Node,
  fn: (node: ts.Node) => boolean
): boolean => {
  if (fn(node)) {
    return true;
  }
  if (node.parent) {
    return recurseCheckNode(node.parent, fn);
  }
  return false;
};

// for all identifiers, we need to find all identifiers with the same
// name. then, we check for the scope that is the closest to the
// target scope.
const resolveIdentifier = (
  scopedIdentifiers: [string, number[]][],
  myName: string,
  scope: number[]
): ts.Identifier | undefined => {
  for (const [name, scopePath] of scopedIdentifiers) {
    // skip if the name doesn't match
    if (name !== myName) {
      continue;
    }

    // skip scopePaths that are larger than the target scope
    if (scopePath.length > scope.length) {
      continue;
    }

    // check if the scopePath is a prefix of the target scope
    let isPrefix = true;
    for (let i = 0; i < scopePath.length; i++) {
      if (scopePath[i] !== scope[i]) {
        isPrefix = false;
        break;
      }
    }

    // if it is a prefix, we need to update the identifier
    if (isPrefix && scopePath.length !== 0) {
      return ts.createIdentifier(`${name}$${scopePath.join("_")}`);
    }
  }
};

const addABPIdentifiers = (
  pattern: ts.ArrayBindingPattern,
  list: [string, number[]][],
  scope: number[]
) => {
  for (const element of pattern.elements) {
    if (ts.isBindingElement(element)) {
      if (ts.isIdentifier(element.name)) {
        list.push([element.name.text, scope]);
      } else if (ts.isArrayBindingPattern(element.name)) {
        addABPIdentifiers(element.name, list, scope);
      } else if (ts.isObjectBindingPattern(element.name)) {
        addOBPIdentifiers(element.name, list, scope);
      }
    }
  }
};

const addOBPIdentifiers = (
  pattern: ts.ObjectBindingPattern,
  list: [string, number[]][],
  scope: number[]
) => {
  for (const element of pattern.elements) {
    if (ts.isBindingElement(element)) {
      if (ts.isIdentifier(element.name)) {
        list.push([element.name.text, scope]);
      } else if (ts.isObjectBindingPattern(element.name)) {
        addOBPIdentifiers(element.name, list, scope);
      } else if (ts.isArrayBindingPattern(element.name)) {
        addABPIdentifiers(element.name, list, scope);
      }
    }
  }
};

// Transformer that alpha-renames all identifiers in a source file.
// If we have a NamedDeclaration, we need to update the name in the symbol table.
// If we have an Identifier, we need to update the text of the node, with the
// one from the symbol table.
//
// TODO: worry about namespaces
const alphaRenameTransformer: ts.TransformerFactory<ts.SourceFile> = (
  context
) => {
  return (sourceFile) => {
    // NOTE: we do two passes here for mutual recursion and dependency reasons.

    // [name, scope_path] list
    const scopedIdentifiers: [string, number[]][] = [];
    let counter = 0;
    const makeDeclarationVisitor = (scope: number[]) => {
      const visit: ts.Visitor = (node) => {
        // the localScope is a temporary variable that we use to update the
        // scope path for only this scope, and not the children scopes.
        let localScope = [...scope];

        const addIdentifier = (ident: ts.Node, scope: number[]) => {
          if (ts.isIdentifier(ident)) {
            scopedIdentifiers.push([ident.text, scope]);
          } else if (ts.isObjectBindingPattern(ident)) {
            addOBPIdentifiers(ident, scopedIdentifiers, scope);
          } else if (ts.isArrayBindingPattern(ident)) {
            addABPIdentifiers(ident, scopedIdentifiers, scope);
          }
        };

        if (isDeclaration(node)) {
          // we could either have a variable declaration or a function declaration,
          // which also has parameters. we need to update the symbol table for
          // both of these cases.
          if (node.name) {
            addIdentifier(node.name, localScope);
          }
        }

        if (
          ts.isFunctionLike(node) &&
          // we don't want to update the parameters of constructors
          !ts.isConstructorDeclaration(node) &&
          node.parameters
        ) {
          // when updating parameters of functions, we anticipate a new scope
          localScope = [...localScope, counter];
          for (const param of node.parameters) {
            if (!param.name) {
              continue;
            }
            addIdentifier(param.name, localScope);
          }
        }

        let nextVisitor = visit;
        // next, we want to create a new scope for any block
        if (isScopedBlock(node)) {
          nextVisitor = makeDeclarationVisitor([...scope, counter++]);
        }

        return ts.visitEachChild(node, nextVisitor, context);
      };
      return visit;
    };

    void ts.visitNode(sourceFile, makeDeclarationVisitor([]));

    // sort the identifier list by the length of the scope path, descending
    // this way, we go from most precise to least precise scope
    scopedIdentifiers.sort((a, b) => b[1].length - a[1].length);
    // console.error(scopedIdentifiers);

    // we reset this counter for the next pass, to match the scope path
    counter = 0;
    const makeIdentifierVisitor = (scope: number[]) => {
      const visit: ts.Visitor = (node) => {
        // the localScope is a temporary variable that we use to update the
        // scope path for only this scope, and not the children scopes.
        let localScope = [...scope];

        // for parameters, we anticipate a new scope.
        // also we need to recursively into the parents until we find the parameter
        // because we may have binding patterns.
        if (recurseCheckNode(node, ts.isParameter)) {
          localScope = [...localScope, counter];
        }

        if (
          ts.isIdentifier(node) &&
          // we don't want to rename property access expressions
          !(
            node.parent &&
            ts.isPropertyAccessExpression(node.parent) &&
            node.parent.name === node
          )
        ) {
          const resolved = resolveIdentifier(
            scopedIdentifiers,
            node.text,
            localScope
          );
          if (resolved) {
            return resolved;
          }
        }

        let nextVisitor = visit;
        if (isScopedBlock(node)) {
          // create a new map for the new scope
          nextVisitor = makeIdentifierVisitor([...scope, counter++]);
        }

        return ts.visitEachChild(node, nextVisitor, context);
      };
      return visit;
    };
    return ts.visitNode(sourceFile, makeIdentifierVisitor([]));
  };
};

// NOTE: These types come from typedef_gen.rs
type FieldInfoCall = {
  type: "call";
  id: string;
  args: (string[] | null)[];
};
type FieldInfoField = {
  type: "field";
  id: string;
};
type FieldInfoObject = {
  type: "object";
  id: string;
  fields: Set<FieldInfo>;
};
type FieldInfo = FieldInfoCall | FieldInfoField | FieldInfoObject;

const isField = (info: FieldInfo): info is FieldInfoField =>
  info.type === "field";

const isCall = (info: FieldInfo): info is FieldInfoCall => info.type === "call";

const isObject = (info: FieldInfo): info is FieldInfoObject =>
  info.type === "object";

type ParamsType = { [name: string]: Set<FieldInfo> };

// this is just a tuple of (name, Set<FieldInfo>), for analysis purposes,
// does not get used in the final output
type SingleParamType = { name: string; infos: Set<FieldInfo> };

type FuncInfo = {
  params: ParamsType;
  ret: Set<FieldInfo> | null;
};

type ObjectInfoMap = { [name: string]: FuncInfo };

// merges ObjectInfoMap objects together
// for example:
// Object {
//      id: "d",
//      fields: {
//          Field {
//              id: "e",
//          },
//      },
//  },
//  Object {
//      id: "d",
//      fields: {
//          Field {
//              id: "m",
//          },
//      },
//  },
//
// Becomes:
// Object {
//     id: "d",
//     fields: {
//        Field {
//            id: "e",
//        },
//        Field {
//            id: "m",
//        },
//     },
// },
const mergeObjectInfo = (objectInfoMap: ObjectInfoMap): ObjectInfoMap => {
  const mergedObjectInfoMap: ObjectInfoMap = {};

  const mergeFieldInfos = (fieldInfos: Set<FieldInfo>): Set<FieldInfo> => {
    const mergedFieldInfos: Set<FieldInfo> = new Set();

    for (const fieldInfo of fieldInfos) {
      if (isField(fieldInfo) || isCall(fieldInfo)) {
        mergedFieldInfos.add(fieldInfo);
      } else if (isObject(fieldInfo)) {
        let found = false;
        for (const info of mergedFieldInfos) {
          if (isObject(info) && info.id === fieldInfo.id) {
            found = true;
            const newFields: Set<FieldInfo> = new Set();
            for (const merged of [
              ...mergeFieldInfos(fieldInfo.fields),
              ...info.fields,
            ]) {
              if (isObject(merged)) {
                for (const info of newFields) {
                  if (isField(info) && info.id === merged.id) {
                    newFields.delete(info);
                  }
                }
                newFields.add(merged);
              } else if (
                !(
                  isField(merged) &&
                  [...info.fields].some((f) => f.id === merged.id)
                )
              ) {
                newFields.add(merged);
              }
            }
            info.fields = newFields;
          } else if (isField(info) && info.id === fieldInfo.id) {
            // de-duplicate fields with the same name as the object
            mergedFieldInfos.delete(info);
          }
        }

        if (!found) {
          mergedFieldInfos.add(fieldInfo);
        }
      }
    }

    return mergedFieldInfos;
  };

  for (const [id, funcInfo] of Object.entries(objectInfoMap)) {
    const newFuncInfo: FuncInfo = {
      params: {},
      ret: null,
    };

    for (const [paramName, paramFieldInfos] of Object.entries(
      funcInfo.params
    )) {
      if (paramFieldInfos) {
        newFuncInfo.params[paramName] = mergeFieldInfos(paramFieldInfos);
      }
    }

    if (funcInfo.ret) {
      newFuncInfo.ret = mergeFieldInfos(funcInfo.ret);
    }

    mergedObjectInfoMap[id] = newFuncInfo;
  }

  return mergedObjectInfoMap;
};

// simple object info function. this is just a placeholder for now.
export const objectInfo = (sourceFile: ts.SourceFile): ObjectInfoMap => {
  let transformed = ts.transform(sourceFile, [alphaRenameTransformer])
    .transformed[0];

  console.error(codePrinter.printFile(transformed));

  const objectInfoMap: ObjectInfoMap = {};

  const visitFunc = (
    node: ts.Node,
    paramMap: Map<string, SingleParamType>,
    to_be_patched: FieldInfo | null
  ): void => {
    const getArgForCall = (node: ts.Node): string[] | null => {
      if (ts.isIdentifier(node)) {
        const param = paramMap.get(node.text);
        return param ? [param.name] : null;
      } else if (ts.isPropertyAccessExpression(node)) {
        const left = getArgForCall(node.expression);
        if (left) {
          return [...left, node.name.text];
        }
      }
      return null;
    };

    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isPropertyAccessExpression(node.expression.expression)
    ) {
      // console.error("call property access expression, patch", to_be_patched);
      if (to_be_patched === null) {
        to_be_patched = {
          type: "call",
          id: node.expression.name.text,
          args: node.arguments.map(getArgForCall),
        };
      }
    } else if (
      ts.isPropertyAccessExpression(node) &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      // console.error("property access expression, patch", to_be_patched);

      // we need to create a new object
      // we either have to_be_patched == null or to_be_patched.type == something.
      // if it's null, we create a field.
      // if it's not null, we take that object and make it the child of the new object.
      if (to_be_patched === null) {
        to_be_patched = {
          type: "field",
          id: node.name.text,
        };
      } else if (
        // if we have a to_be_patched that is a call, and
        // has the same name, we skip it.
        to_be_patched.type !== "call" &&
        to_be_patched.id !== node.name.text
      ) {
        to_be_patched = {
          type: "object",
          id: node.name.text,
          fields: new Set([to_be_patched]),
        };
      }
    } else if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      paramMap.has(node.expression.expression.text)
    ) {
      const param = node.expression.expression.text;
      const field = node.expression.name.text;

      // if we have already have this field as a Field, we remove it.
      // Call is more precise than Field.
      paramMap.get(param)!.infos.delete({
        type: "field",
        id: field,
      });

      paramMap.get(param)!.infos.add({
        type: "call",
        id: field,
        args: node.arguments.map(getArgForCall),
      });
    } else if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      paramMap.has(node.expression.text)
    ) {
      const field = node.name.text;
      const param = node.expression.text;

      // if we need to patch, we make this an object and add the patch.
      if (to_be_patched !== null) {
        paramMap.get(param)!.infos.add({
          type: "object",
          id: field,
          fields: new Set([to_be_patched]),
        });

        // we don't need to patch anymore
        to_be_patched = null;
      } else if (
        // push if it doesn't exist
        // NOTE: if we have already have this field as a Call, we leave it as a Call.
        ![...paramMap.get(param)!.infos].some(
          (fieldInfo) => fieldInfo.id === field
        )
      ) {
        paramMap.get(param)!.infos.add({
          type: "field",
          id: field,
        });
      }
    }
    ts.forEachChild(node, (child) => visitFunc(child, paramMap, to_be_patched));
  };

  const visitor = (node: ts.Node): void => {
    if (ts.isFunctionDeclaration(node) && node.name) {
      const paramMap = new Map<string, SingleParamType>();
      for (const param of node.parameters) {
        // TODO: handle more complex cases
        if (ts.isIdentifier(param.name)) {
          paramMap.set(param.name.text, {
            infos: new Set(),
            name: param.name.text,
          });
        }
      }

      visitFunc(node, paramMap, null);
      const params: ParamsType = {};
      for (const param of node.parameters) {
        // TODO: handle more complex cases
        if (ts.isIdentifier(param.name)) {
          params[param.name.text] = paramMap.get(param.name.text)!.infos;
        }
      }
      const funcInfo: FuncInfo = {
        params: params,
        ret: null,
      };
      objectInfoMap[node.name.text] = funcInfo;
      ts.forEachChild(node, visitor);
    }
  };

  ts.forEachChild(transformed, visitor);

  return mergeObjectInfo(objectInfoMap);
};
