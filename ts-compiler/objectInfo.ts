import assert from "assert";
import ts, { isVariableDeclaration } from "typescript";
import { setUnion } from "./utils";

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
export type FieldInfo = FieldInfoCall | FieldInfoField | FieldInfoObject;

const isField = (info: FieldInfo): info is FieldInfoField =>
  info.type === "field";

const isCall = (info: FieldInfo): info is FieldInfoCall => info.type === "call";

const isObject = (info: FieldInfo): info is FieldInfoObject =>
  info.type === "object";

type ParamsType = { [name: string]: Set<FieldInfo> };

export type FuncInfo = {
  params: ParamsType;
  ret: Set<FieldInfo> | null;
};

export type ObjectInfoMap = { [name: string]: FuncInfo };

// merges ObjectInfoMap objects together and normalizes them
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
const normalizeObjectInfo = (objectInfoMap: ObjectInfoMap): ObjectInfoMap => {
  const normObjectInfoMap: ObjectInfoMap = {};

  const normFieldInfos = (fieldInfos: Set<FieldInfo>): Set<FieldInfo> => {
    const normedFieldInfos: Set<FieldInfo> = new Set();

    for (const fieldInfo of fieldInfos) {
      if (isField(fieldInfo) || isCall(fieldInfo)) {
        normedFieldInfos.add(fieldInfo);
      } else if (isObject(fieldInfo)) {
        let found = false;
        for (const info of normedFieldInfos) {
          if (isObject(info) && info.id === fieldInfo.id) {
            found = true;
            const newFields: Set<FieldInfo> = new Set();
            for (const merged of normFieldInfos(
              setUnion(info.fields, fieldInfo.fields)
            )) {
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
                  [...newFields].some((f) => f.id === merged.id)
                )
              ) {
                newFields.add(merged);
              }
            }
            info.fields = newFields;
          } else if (isField(info) && info.id === fieldInfo.id) {
            // de-duplicate fields with the same name as the object
            normedFieldInfos.delete(info);
          }
        }

        if (!found) {
          normedFieldInfos.add(fieldInfo);
        }
      }
    }

    return normedFieldInfos;
  };

  for (const [id, funcInfo] of Object.entries(objectInfoMap)) {
    const newFuncInfo: FuncInfo = {
      params: {},
      ret: null,
    };

    for (const [paramName, paramFieldInfos] of Object.entries(
      funcInfo.params
    )) {
      if (paramFieldInfos.size > 0) {
        newFuncInfo.params[paramName] = normFieldInfos(paramFieldInfos);
      }
    }

    if (funcInfo.ret) {
      newFuncInfo.ret = normFieldInfos(funcInfo.ret);
    }

    normObjectInfoMap[id] = newFuncInfo;
  }

  return normObjectInfoMap;
};

// this type is for analysis purposes, does not get used in the final output.
// the "from" field is used when resolving the path of a param that has been
// destructured via object pattern binding or let aliasing
type SingleParamType = {
  name: string;
  infos: Set<FieldInfo>;
  from: SingleParamType | null;
};

// converts a SingleParamType to a FieldInfo. if it has no fields, it is
// converted to a FieldInfoField, otherwise it is converted to a FieldInfoObject
const singleParamToObject = (singleParam: SingleParamType): FieldInfo => {
  if (singleParam.infos.size === 0) {
    return {
      type: "field",
      id: singleParam.name,
    };
  } else {
    return {
      type: "object",
      id: singleParam.name,
      fields: singleParam.infos,
    };
  }
};

// gets the fieldinfo with the given name from the given set of field infos
const getFieldInfo = (
  fieldInfos: Set<FieldInfo>,
  name: string,
  kind: "field" | "call" | "object" | null
): FieldInfo | null => {
  for (const fieldInfo of fieldInfos) {
    if (fieldInfo.id === name && (kind === null || fieldInfo.type === kind)) {
      return fieldInfo;
    }
  }
  return null;
};

const getObjectPath = (
  node: ts.Node,
  paramMap: Map<string, SingleParamType>
): string[] | null => {
  if (ts.isIdentifier(node)) {
    const param = paramMap.get(node.text);
    return param ? [param.name] : null;
  } else if (ts.isPropertyAccessExpression(node)) {
    const left = getObjectPath(node.expression, paramMap);
    if (left) {
      return [...left, node.name.text];
    }
  }
  return null;
};

// helper function for resolveVarDecl
// resolves a property access expression, linking params together
// assumes that the given path has at least one element
const resolvePropertyAccess = (
  path: string[],
  paramMap: Map<string, SingleParamType>
): SingleParamType => {
  assert(path.length > 0);
  let left = paramMap.get(path[0]);
  let right = paramMap.get(path[1]);
  while (left && path.length > 1) {
    if (!right) {
      right = {
        name: path[1],
        infos: new Set(),
        from: left,
      };
    }

    left = right;
    path.shift();
    right = paramMap.get(path[1]);
  }
  return left!;
};

// helper function for resolveVarDecl
// resolves the object binding pattern
const resolveOBP = (
  pattern: ts.ObjectBindingPattern,
  param: SingleParamType,
  paramMap: Map<string, SingleParamType>
): void => {
  for (const element of pattern.elements) {
    const bindParam: SingleParamType = {
      name: "",
      infos: new Set(),
      from: param,
    };
    if (
      element.propertyName &&
      ts.isIdentifier(element.propertyName) &&
      ts.isIdentifier(element.name)
    ) {
      bindParam.name = element.propertyName.text;
      paramMap.set(element.name.text, bindParam);
    } else if (ts.isIdentifier(element.name)) {
      bindParam.name = element.name.text;
      paramMap.set(element.name.text, bindParam);
    } else if (
      ts.isObjectBindingPattern(element.name) &&
      element.propertyName &&
      ts.isIdentifier(element.propertyName)
    ) {
      bindParam.name = element.propertyName.text;
      paramMap.set(element.propertyName.text, bindParam);
      resolveOBP(element.name, bindParam, paramMap);
    }
  }
};

// resolves the variable declaration. assumes that the variable declaration
// initializer is defined. the resolution is done by following the from links
// and is stored in the paramMap
const resolveVarDecl = (
  node: ts.VariableDeclaration,
  paramMap: Map<string, SingleParamType>
): void => {
  assert(node.initializer);
  const initializer = node.initializer;
  if (ts.isIdentifier(initializer)) {
    const param = paramMap.get(initializer.text);
    if (param) {
      if (ts.isIdentifier(node.name)) {
        paramMap.set(node.name.text, param);
      } else if (ts.isObjectBindingPattern(node.name)) {
        resolveOBP(node.name, param, paramMap);
      }
    }
  } else if (ts.isPropertyAccessExpression(initializer)) {
    const path = getObjectPath(initializer, paramMap);
    if (path) {
      if (ts.isIdentifier(node.name)) {
        paramMap.set(node.name.text, resolvePropertyAccess(path, paramMap));
      } else if (ts.isObjectBindingPattern(node.name)) {
        resolveOBP(node.name, resolvePropertyAccess(path, paramMap), paramMap);
      }
    }
  }
};

// NOTE: assumes that sourceFile is alpha-renamed
export const objectInfo = (sourceFile: ts.SourceFile): ObjectInfoMap => {
  const objectInfoMap: ObjectInfoMap = {};

  const visitFunc = (
    node: ts.Node,
    paramMap: Map<string, SingleParamType>,
    to_be_patched: FieldInfo | null
  ): void => {
    if (isVariableDeclaration(node) && node.initializer) {
      // if we have a vardecl, we may be aliasing an object
      // we need to check if the initializer is an object
      resolveVarDecl(node, paramMap);
    } else if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isPropertyAccessExpression(node.expression.expression)
    ) {
      // console.error("call property access expression, patch", to_be_patched);
      if (to_be_patched === null) {
        to_be_patched = {
          type: "call",
          id: node.expression.name.text,
          args: node.arguments.map((arg) => getObjectPath(arg, paramMap)),
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
        args: node.arguments.map((arg) => getObjectPath(arg, paramMap)),
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

    // recurse
    ts.forEachChild(node, (child) => visitFunc(child, paramMap, to_be_patched));
  };

  const visitor = (node: ts.Node): void => {
    if (ts.isFunctionDeclaration(node) && node.name) {
      const paramMap = new Map<string, SingleParamType>();
      for (const param of node.parameters) {
        // TODO: handle more complex cases (OBP or ABP(?))
        if (ts.isIdentifier(param.name)) {
          paramMap.set(param.name.text, {
            infos: new Set(),
            name: param.name.text,
            from: null,
          });
        }
      }

      visitFunc(node, paramMap, null);
      const params: ParamsType = {};
      console.error(paramMap);
      // NOTE: a map in typescript iterates in insertion order,
      // so this is safe.
      for (let paramInfo of paramMap.values()) {
        if (paramInfo.from === null) {
          // original param, we simply add it.
          params[paramInfo.name] = paramInfo.infos;
        } else {
          // this paramInfo is linked to another paramInfo.
          // we need to merge the infos.
          while (paramInfo.from !== null) {
            paramInfo.from.infos.add(singleParamToObject(paramInfo));
            paramInfo = paramInfo.from;
          }
        }
      }

      const funcInfo: FuncInfo = {
        params: params,
        ret: null,
      };

      objectInfoMap[node.name.text] = funcInfo;
    }
    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(sourceFile, visitor);

  return normalizeObjectInfo(objectInfoMap);
};
