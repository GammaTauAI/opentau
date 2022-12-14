import ts from "typescript";
import * as net from "net";
import { printSource } from "./printer";
import { makeTree } from "./tree";
import { stubSource } from "./stubPrinter";
import { checkCompleted } from "./check";
import { weavePrograms } from "./weave";
import { findUsages } from "./findUsages";

// the global printer object!
export const codePrinter = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  removeComments: false,
  omitTrailingSemicolon: false,
});

if (process.argv.length != 4) {
  console.log("usage: [path to socket] [pid of rust proc]");
  process.exit(1);
}

// every 3 seconds, check if the rust proc is still alive, if not we quit
const rustpid = process.argv[3];
setInterval(function () {
  if (!isPidRunning(Number(rustpid))) {
    process.exit(0);
  }
}, 3000);

function isPidRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

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

const handlePrint = (decodedText: string, req: any): string => {
  // create the source file
  const sourceFile = ts.createSourceFile(
    "bleh.ts", // name does not matter until we save, which we don't from here
    decodedText,
    ts.ScriptTarget.Latest,
    false, // for setParentNodes
    ts.ScriptKind.TS
  );
  req.typeName = req.typeName || "_hole_"; // default to _hole_
  const res = printSource(sourceFile, req.typeName);
  const base64 = Buffer.from(res).toString("base64");
  return JSON.stringify({
    type: "printResponse",
    text: base64,
  });
};

const handleTree = (decodedText: string): string => {
  // create the source file
  const sourceFile = ts.createSourceFile(
    "bleh.ts", // name does not matter until we save, which we don't from here
    decodedText,
    ts.ScriptTarget.Latest,
    true, // for setParentNodes
    ts.ScriptKind.TS
  );
  const res = makeTree(sourceFile);
  const base64 = Buffer.from(JSON.stringify(res)).toString("base64");
  return JSON.stringify({
    type: "treeResponse",
    text: base64,
  });
};

const handleStub = (decodedText: string): string => {
  // create the source file
  const sourceFile = ts.createSourceFile(
    "bleh.ts", // name does not matter until we save, which we don't from here
    decodedText,
    ts.ScriptTarget.Latest,
    true, // for setParentNodes
    ts.ScriptKind.TS
  );
  const res = stubSource(sourceFile);
  const base64 = Buffer.from(res).toString("base64");
  return JSON.stringify({
    type: "stubResponse",
    text: base64,
  });
};

const handleCheck = (decodedText: string, req: any): string => {
  const decodedOriginal = Buffer.from(req.original, "base64").toString("utf8");
  // create the source file
  const originalFile = ts.createSourceFile(
    "bleh.ts", // name does not matter until we save, which we don't from here
    decodedOriginal,
    ts.ScriptTarget.Latest,
    false, // for setParentNodes
    ts.ScriptKind.TS
  );

  const completedProgram = ts.createProgram({
    rootNames: ["comp.ts"],
    options: compilerOptions,
    host: makeCompilerHost(
      "comp.ts",
      ts.createSourceFile(
        "comp.ts",
        decodedText,
        ts.ScriptTarget.Latest,
        false, // for setParentNodes
        ts.ScriptKind.TS
      )
    ),
  });

  const completedFile = completedProgram.getSourceFile("comp.ts")!;

  const res = checkCompleted(
    originalFile,
    completedFile,
    completedProgram.getTypeChecker()
  );

  return JSON.stringify({
    type: "checkResponse",
    text: res[0],
    score: res[1],
  });
};

const handleWeave = (decodedText: string, req: any): string => {
  const decodedNettle = Buffer.from(req.nettle, "base64").toString("utf8");

  if (req.level == undefined) {
    console.error("level not specified, defaulting to 0");
    req.level = 0;
  }

  // due to type information, we have to create a program, instead of just a source file
  const originalName = "original.ts";
  const nettleName = "nettle.ts";

  const originalProgram = ts.createProgram({
    rootNames: [originalName],
    options: compilerOptions,
    host: makeCompilerHost(
      originalName,
      ts.createSourceFile(originalName, decodedText, ts.ScriptTarget.Latest)
    ),
  });

  const nettleProgram = ts.createProgram({
    rootNames: [nettleName],
    options: compilerOptions,
    host: makeCompilerHost(
      nettleName,
      ts.createSourceFile(nettleName, decodedNettle, ts.ScriptTarget.Latest)
    ),
  });

  const res = weavePrograms(
    originalProgram,
    originalName,
    nettleProgram,
    nettleName,
    req.level
  );

  const base64 = Buffer.from(res).toString("base64");

  return JSON.stringify({
    type: "weaveResponse",
    text: base64,
  });
};

const handleUsages = (decodedText: string, req: any): string => {
  const decodedInner = Buffer.from(req.innerBlock, "base64").toString("utf8");

  // create the source files
  const outerFile = ts.createSourceFile(
    "outer.ts", // name does not matter until we save, which we don't from here
    decodedText,
    ts.ScriptTarget.Latest,
    true, // for setParentNodes
    ts.ScriptKind.TS
  );

  const innerFile = ts.createSourceFile(
    "inner.ts", // name does not matter until we save, which we don't from here
    decodedInner,
    ts.ScriptTarget.Latest,
    true, // for setParentNodes
    ts.ScriptKind.TS
  );

  const res = findUsages(outerFile, innerFile);

  const base64 = Buffer.from(res).toString("base64");

  return JSON.stringify({
    type: "usagesResponse",
    text: base64,
  });
};

var unixServer = net.createServer(function (client) {
  client.on("data", function (data) {
    // try to parse the data as a json object

    var req; // in the format of {cmd: "the-cmd", text: "the-text", ...}
    var decodedText;
    try {
      req = JSON.parse(data.toString());
      decodedText = Buffer.from(req.text, "base64").toString("utf8");
    } catch (e) {
      client.write(JSON.stringify({ type: "error", message: e.message }));
      return;
    }

    try {
      switch (req.cmd) {
        // simply print out the text (and puts unknown types).
        // req: {cmd: "print", text: "the-text", typeName: "the-type"}
        case "print": {
          client.write(handlePrint(decodedText, req));
          break;
        }
        // generate the text tree from the given text (and puts unknown types)
        case "tree": {
          client.write(handleTree(decodedText));
          break;
        }
        // generate a stub for the given node (that is type-annotated)
        case "stub": {
          client.write(handleStub(decodedText));
          break;
        }
        // check if the given text is complete
        // req: {cmd: "check", text: "the-completed-text", original: "the-original-text"}
        // additionally, returns a score for the completion.
        case "check": {
          client.write(handleCheck(decodedText, req));
          break;
        }
        // weaves the given text (has to be type-complete, could be stubbed) into the original text
        // req: {cmd: "weage", text: "original text", nettle: "the text to weave in", level: 0}
        case "weave": {
          client.write(handleWeave(decodedText, req));
          break;
        }
        // finds usages of the given inner block in the outer block
        // req: {cmd: "usages", text: "outer block", innerBlock: "inner block"}
        case "usages": {
          client.write(handleUsages(decodedText, req));
          break;
        }
        default: {
          client.write(
            JSON.stringify({
              type: "error",
              message: `unknown command ${req.cmd}`,
            })
          );
        }
      }
      // yeah, pretty bad to catch all, but we want this to work no matter what.
    } catch (e) {
      client.write(
        JSON.stringify({
          type: "error",
          message: e.message + "\ntrace: \n" + e.stack,
        })
      );
    }
  });
});

const socket = process.argv[2];
unixServer.listen(socket);
console.log("Listening on " + socket + "\n");

// handlers to close the server, or the socket will remain open forever
process.on("exit", close);
process.on("SIGINT", close);
process.on("SIGTERM", close);

function close() {
  console.log("Closing " + socket);
  unixServer.close();
  process.exit(0);
}
