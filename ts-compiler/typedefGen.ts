import ts, { PropertySignature, InterfaceDeclaration } from "typescript";
import { objectInfo, ObjectInfoMap, FuncInfo, FieldInfo } from "./objectInfo";
import { codePrinter } from "./utils";
import { alphaRenameTransformer } from "./aRename";

// NOTE: assumes that the source file is alphaRenamed. This pass removes the alphaRenaming
// and returns the original names.
export const typedefGen = (alphaRenamedSourceFile: ts.SourceFile): string => {
  // TODO: remove alpha renamed items

  // builds an interface template given a map of property names and one of:
  //  - _hole_
  //  - _name_{idx}, where `idx` is the index of the interface
  const buildInterfaceTemplate = (
    namePlaceholder: string,
    propertyMap: Map<string, string>
  ): InterfaceDeclaration => {
    // create a list of property signatures
    // `name` is the actual name of the property
    // `typePlaceHolder` is either `_hole_` or `_name_{idx}`
    const propertySignatures: Array<PropertySignature> = Array.from(
      propertyMap
    ).map(([name, typePlaceHolder]: [string, string]) =>
      ts.createPropertySignature(
        undefined,
        ts.createIdentifier(name),
        undefined,
        ts.createTypeReferenceNode(typePlaceHolder, undefined),
        undefined
      )
    );

    // create a new interface with the array of property signatures
    const interfaceNode: InterfaceDeclaration = ts.createInterfaceDeclaration(
      undefined,
      undefined,
      ts.createIdentifier(namePlaceholder),
      undefined,
      undefined,
      propertySignatures
    );
    return interfaceNode;
  };

  const objMap: ObjectInfoMap = objectInfo(sourceFile);

  let propertyMaps = new Set<Map<string, string>>();
  let curInterfaceIdx = 0;
  // TODO: handle alpha-renamed names
  // TODO: handle nested objects
  for (const name in objMap) {
    const funcInfo: FuncInfo = objMap[name];
    for (const paramNamePlaceholder in funcInfo.params) {
      const fields: Set<FieldInfo> = funcInfo.params[paramNamePlaceholder];
      const propertyMap = new Map<string, string>();
      for (const field of fields) {
        if (field.type === "object") {
          // if it's an Object, we want to create a _name_{idx} placeholder
          // then create a new interface for the object
          propertyMap.set(field.id, `_name_${curInterfaceIdx}`);
          curInterfaceIdx++;
        } else {
          // otherwise, it's a Field or a Call -> leave it up to the type annotator
          propertyMap.set(field.id, "_hole_");
        }
      }
      // only add propertyMap if not in propertyMaps to avoid duplicate interfaces
      if (!propertyMaps.has(propertyMap)) {
        propertyMaps.add(propertyMap);
      }
    }
  }

  // create a list of interfaces
  const interfaceDeclarations = new Array<InterfaceDeclaration>();
  for (const propertyMap of propertyMaps) {
    const interfaceDeclaration = buildInterfaceTemplate(
      `_name_${curInterfaceIdx}`,
      propertyMap
    );
    curInterfaceIdx++;
    interfaceDeclarations.push(interfaceDeclaration);
  }

  // TODO: add after the last import statement
  //  - for now, this adds to the end of the file
  // add the interfaces to the source file
  const newSourceFile = ts.updateSourceFileNode(sourceFile, [
    ...sourceFile.statements,
    ...interfaceDeclarations,
  ]);

  // Find the last import statement in the file
  //const lastImportStatement = sourceFile.statements.find(
  //(statement) => ts.isImportDeclaration(statement) || ts.isImportEqualsDeclaration(statement)
  //)

  // Insert the interface declaration after the last import statement
  // don't know if there's a better way to do this
  //if (lastImportStatement) {
  //} else {
  //}

  // convert source file to string
  return codePrinter.printFile(newSourceFile);
};

// TODO: remove this
const loadFile = (fileName: string): ts.SourceFile => {
  const program = ts.createProgram([fileName], {});
  const tmpSourceFile = program.getSourceFile(fileName);
  if (!tmpSourceFile) {
    throw new Error("Could not load source file");
  }
  const decodedText = ts.sys.readFile(fileName, "utf8");
  if (!decodedText) {
    throw new Error("Could not read file");
  }
  const sourceFile = ts.createSourceFile(
    "bleh.ts", // name does not matter until we save, which we don't from here
    decodedText,
    ts.ScriptTarget.Latest,
    true, // for setParentNodes
    ts.ScriptKind.TS
  );

  const alphaRenamed = ts.transform(sourceFile, [alphaRenameTransformer])
    .transformed[0];
  return alphaRenamed;
};

// test this
const sourceFile = loadFile("../utils/testfiles/defgen/medium.ts");
const newSourceFileString = typedefGen(sourceFile);
console.log(newSourceFileString);
