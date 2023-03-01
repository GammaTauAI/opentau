import ts from "typescript";
import { alphaRenameTransformer } from "./aRename";
import { codePrinter } from "./utils";


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
