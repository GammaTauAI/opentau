import ts from "typescript";
import * as fs from "fs";
import { printSource } from "./printer";

// get argv[1]
const cmd = process.argv[2];
if (!cmd) {
  console.error("No command provided. Usage: ts-ast [print]");
  process.exit(1);
}

switch (cmd) {
  // simply print out the text (and puts unknown types)
  case "print": {
    // create the source file
    const sourceFile = ts.createSourceFile(
      "bleh.ts", // name does not matter until we save, which we don't from here
      fs.readFileSync(0, "utf8"), // read from stdin
      ts.ScriptTarget.Latest,
      false, // for setParentNodes
      ts.ScriptKind.TS
    );

    printSource(sourceFile);
    break;
  }
  // generate the text tree from the given text (and puts unknown types)
  case "tree": {
    // TODO
    break;
  }
  // generate a stub for the given node (that is type-annotated)
  case "stub": {
    // TODO
  }
  default: {
    console.error(`Unknown command: ${cmd}`);
    process.exit(1);
  }
}
