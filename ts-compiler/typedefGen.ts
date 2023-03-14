import ts, { PropertySignature, InterfaceDeclaration } from "typescript";
import {
  objectInfo,
  fieldInfoToString,
  ObjectInfoMap,
  FuncInfo,
  FieldInfo,
  FieldInfoObject,
} from "./objectInfo";
import { codePrinter } from "./utils";
import { alphaRenameTransformer } from "./aRename";

interface InnerStruct {
  name: string;
  is_dupl: boolean;
  is_constructed: boolean;
  node: ts.TypeLiteralNode;
}

// TODO: duplicate inner structs with depth > 2

const buildInnerStructs = (objMap: ObjectInfoMap): Map<string, InnerStruct> => {
  const handleObj = (obj: FieldInfoObject): ts.TypeLiteralNode => {
    const members = new Array<ts.TypeElement>();
    for (const field of obj.fields) {
      if (field.type === "field" || field.type === "call") {
        members.push(
          ts.createPropertySignature(
            undefined,
            ts.createIdentifier(field.id),
            undefined,
            ts.createTypeReferenceNode("_hole_", undefined),
            undefined
          )
        );
      } else {
        // create an inner struct
        members.push(
          ts.createPropertySignature(
            undefined,
            ts.createIdentifier(field.id),
            undefined,
            handleObj(field),
            undefined
          )
        );
      }
    }
    return ts.createTypeLiteralNode(members);
  };

  const innerStructs = new Map<string, InnerStruct>();
  for (const name in objMap) {
    const funcInfo: FuncInfo = objMap[name];
    for (const obj in funcInfo.params) {
      const params: Set<FieldInfo> = funcInfo.params[obj];
      for (const param of params) {
        if (param.type === "object") {
          const key = fieldInfoToString(param);
          if (innerStructs.has(key)) {
            // if it's already in the map, mark it as a duplicate
            const innerStruct = innerStructs.get(key);
            if (innerStruct) {
              innerStruct.is_dupl = true;
            }
          } else {
            // if it's not in the map, add it to the map but not as a duplicate
            const innerStruct = {
              name: `_hole_${innerStructs.size}`,
              is_dupl: false,
              is_constructed: false,
              node: handleObj(param),
            };
            innerStructs.set(key, innerStruct);
          }
        }
      }
    }
  }
  return innerStructs;
};

const buildInterfaceDeclarations = (
  objMap: ObjectInfoMap,
  innerStructs: Map<string, InnerStruct>
): Array<InterfaceDeclaration> => {
  const innerStructToInterfaceDeclaration = (
    innerStruct: InnerStruct
  ): InterfaceDeclaration => {
    const members = new Array<ts.TypeElement>();
    for (const member of innerStruct.node.members) {
      members.push(member);
    }
    return ts.createInterfaceDeclaration(
      undefined,
      undefined,
      ts.createIdentifier(innerStruct.name),
      undefined,
      undefined,
      members
    );
  };

  const interfaceDeclarations = new Array<InterfaceDeclaration>();
  for (const name in objMap) {
    const funcInfo: FuncInfo = objMap[name];
    for (const obj in funcInfo.params) {
      const params: Set<FieldInfo> = funcInfo.params[obj];
      const propertySignatures = new Array<PropertySignature>();
      for (const param of params) {
        if (param.type === "field") {
          propertySignatures.push(
            ts.createPropertySignature(
              undefined,
              ts.createIdentifier(param.id),
              undefined,
              ts.createTypeReferenceNode("_hole_", undefined),
              undefined
            )
          );
        } else if (param.type === "call") {
          propertySignatures.push(
            ts.createPropertySignature(
              undefined,
              ts.createIdentifier(param.id),
              undefined,
              ts.createTypeReferenceNode("_hole_", undefined),
              undefined
            )
          );
        } else {
          const key = fieldInfoToString(param);
          const innerStruct = innerStructs.get(key);
          if (innerStruct) {
            if (innerStruct.is_dupl) {
              // add the `_hole_{idx}` link to the inner struct
              propertySignatures.push(
                ts.createPropertySignature(
                  undefined,
                  ts.createIdentifier(param.id),
                  undefined,
                  ts.createTypeReferenceNode(innerStruct.name, undefined),
                  undefined
                )
              );
              // build the inner struct as a separate interface if it hasn't been built yet
              if (!innerStruct.is_constructed) {
                interfaceDeclarations.push(
                  innerStructToInterfaceDeclaration(innerStruct)
                );
                innerStruct.is_constructed = true;
              }
            } else {
              propertySignatures.push(
                ts.createPropertySignature(
                  undefined,
                  ts.createIdentifier(param.id),
                  undefined,
                  innerStruct.node,
                  undefined
                )
              );
            }
          } else {
            // the inner struct should always be in the map
          }
        }
      }
      const interfaceDeclaration: InterfaceDeclaration =
        ts.createInterfaceDeclaration(
          undefined,
          undefined,
          ts.createIdentifier("_name_"),
          undefined,
          undefined,
          propertySignatures
        );
      interfaceDeclarations.push(interfaceDeclaration);
    }
  }
  return interfaceDeclarations;
};

const genInterfaceDeclarations = (
  objMap: ObjectInfoMap
): Array<InterfaceDeclaration> => {
  // first pass: build map of inner structs
  // - key: (string) stringified fieldInfo with fields sorted
  // - value: (InnerStruct)
  const innerStructs: Map<string, InnerStruct> = buildInnerStructs(objMap);
  console.log(innerStructs);

  // second pass: build the interface declarations
  const interfaceDeclarations = buildInterfaceDeclarations(
    objMap,
    innerStructs
  );

  return interfaceDeclarations;
};

const removeAlphaRenaming = (sourceFile: ts.SourceFile): ts.SourceFile => {
  const removeAlphaRenameTransformer = (
    ctx: ts.TransformationContext
  ): ts.Transformer<ts.SourceFile> => {
    const visitor = (node: ts.Node): ts.Node => {
      if (ts.isIdentifier(node) && node.text.includes("$")) {
        const newName = node.text.split("$")[0];
        return ts.createIdentifier(newName);
      }
      return ts.visitEachChild(node, visitor, ctx);
    };
    return (node: ts.SourceFile) => ts.visitNode(node, visitor);
  };
  const newSourceFile = ts.transform(sourceFile, [
    removeAlphaRenameTransformer,
  ]);
  return newSourceFile.transformed[0];
};

const insertInterfaceDeclarations = (
  sourceFile: ts.SourceFile,
  interfaceDeclarations: Array<InterfaceDeclaration>
): ts.SourceFile => {
  // TODO: map the interfaces to functions
  // - for now, we add after the last import statement if it exists
  // Find the last import statement in the file
  const lastImportStatement = sourceFile.statements.find(
    (statement) =>
      ts.isImportDeclaration(statement) ||
      ts.isImportEqualsDeclaration(statement)
  );

  if (lastImportStatement) {
    const lastImportStatementIndex =
      sourceFile.statements.indexOf(lastImportStatement);
    return ts.updateSourceFileNode(sourceFile, [
      ...sourceFile.statements.slice(0, lastImportStatementIndex + 1),
      ...interfaceDeclarations,
      ...sourceFile.statements.slice(lastImportStatementIndex + 1),
    ]);
  } else {
    return ts.updateSourceFileNode(sourceFile, [
      ...interfaceDeclarations,
      ...sourceFile.statements,
    ]);
  }
};

// NOTE: assumes that the source file is alphaRenamed. This pass removes the alphaRenaming
// and returns the original names.
export const typedefGen = (alphaRenamedSourceFile: ts.SourceFile): string => {
  // convert to object info
  const objectMap: ObjectInfoMap = objectInfo(alphaRenamedSourceFile);

  // generate interface declarations
  const interfaceDeclarations = genInterfaceDeclarations(objectMap);

  // insert interface declarations
  const newSourceFile = insertInterfaceDeclarations(
    alphaRenamedSourceFile,
    interfaceDeclarations
  );

  // remove alpha-renaming
  const resSourceFile = removeAlphaRenaming(newSourceFile);

  // convert source file to string
  return codePrinter.printFile(resSourceFile);
};

// TODO: remove this
// for testing only
//const loadFile = (fileName: string): ts.SourceFile => {
//const program = ts.createProgram([fileName], {});
//const tmpSourceFile = program.getSourceFile(fileName);
//if (!tmpSourceFile) {
//throw new Error("Could not load source file");
//}
//const decodedText = ts.sys.readFile(fileName, "utf8");
//if (!decodedText) {
//throw new Error("Could not read file");
//}
//const sourceFile = ts.createSourceFile(
//"bleh.ts", // name does not matter until we save, which we don't from here
//decodedText,
//ts.ScriptTarget.Latest,
//true, // for setParentNodes
//ts.ScriptKind.TS
//);

//const alphaRenamed = ts.transform(sourceFile, [alphaRenameTransformer])
//.transformed[0];
//return alphaRenamed;
//};

//// const sourceFile = loadFile("../utils/testfiles/defgen/medium.ts");
//const sourceFile = loadFile(
//"../utils/testfiles/defgen/dedup_with_correct_links.ts"
//);
//const newSourceFileString = typedefGen(sourceFile);
//console.log(newSourceFileString);
