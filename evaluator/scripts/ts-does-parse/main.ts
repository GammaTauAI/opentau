import ts from "typescript";

const compilerOptions = {
  target: ts.ScriptTarget.Latest,
  module: ts.ModuleKind.CommonJS,
  strict: false,
  noImplicitAny: false,
  noImplicitThis: false,
  noEmit: true,
  noImplicitReturns: false,
  allowJs: true,
  checkJs: true,
};

const defaultCompilerHost = ts.createCompilerHost(compilerOptions);

const makeCompilerHost = (
  filename: string,
  sourceFile: ts.SourceFile
): ts.CompilerHost => ({
  getSourceFile: (name, languageVersion) => {
    if (name === filename) {
      return sourceFile;
    } else {
      return defaultCompilerHost.getSourceFile(name, languageVersion);
    }
  },
  writeFile: (_filename, _data) => {},
  getDefaultLibFileName: () =>
    defaultCompilerHost.getDefaultLibFileName(compilerOptions),
  useCaseSensitiveFileNames: () => false,
  getCanonicalFileName: (filename) => filename,
  getCurrentDirectory: () => "",
  getNewLine: () => "\n", // NOTE: would this be \r\n on windows?
  getDirectories: () => [],
  fileExists: () => true,
  readFile: () => "",
});

const createProgram = (code: string, setParentNodes = false): ts.Program => {
  const prog = ts.createProgram({
    rootNames: ["comp.ts"],
    options: compilerOptions,
    host: makeCompilerHost(
      "comp.ts",
      ts.createSourceFile(
        "comp.ts",
        code,
        ts.ScriptTarget.Latest,
        setParentNodes,
        ts.ScriptKind.TS
      )
    ),
  });
  return prog;
};

let code = "";
process.stdin.on("data", (chunk) => {
  code += chunk;
});
process.stdin.on("close", () => {
  const completedProgram = createProgram(code, false);
  const completedFile = completedProgram.getSourceFile("comp.ts")!;
  const diag = completedProgram.getSyntacticDiagnostics(completedFile);
  process.exit(diag.length);
});
