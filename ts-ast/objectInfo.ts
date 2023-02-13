import ts from "typescript";
import { codePrinter } from "./main";

// NOTE: These types come from typedef_gen.rs
type FieldInfo =
  | { type: string; id: string }
  | { type: string; id: string; fields: FieldInfo[] };

type ParamsType = { [name: string]: FieldInfo[] | null };

type FuncInfo = {
  params: ParamsType;
  ret: FieldInfo[] | null;
};

type ObjectInfoMap = { [name: string]: FuncInfo };

export const objectInfo = (sourceFile: ts.SourceFile): ObjectInfoMap => {
  // TODO: remove test code

  // function f(obj) {
  //   obj.a;
  //   obj.b;
  //   obj.m();
  //   obj.d.a;
  // }

  const obj_a = {
    type: "field",
    id: "a",
  };
  const obj_b = {
    type: "field",
    id: "b",
  };

  const obj_m_call = {
    type: "call",
    id: "m",
  };

  const obj_d_a = {
    type: "object",
    id: "d",
    fields: [obj_a],
  };

  const params: ParamsType = {};
  params["obj"] = [obj_a, obj_b, obj_m_call, obj_d_a];

  const funcinfo = {
    params: params,
    ret: null,
  };

  const objectInfoMap: ObjectInfoMap = {};
  objectInfoMap["f"] = funcinfo;

  return objectInfoMap;
};
