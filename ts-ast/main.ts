import ts from "typescript";
import * as net from "net";
import { printSource } from "./printer";
import { makeTree } from "./tree";
import { stubSource } from "./stubPrinter";

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

var unixServer = net.createServer(function (client) {
  client.on("data", function (data) {
    // try to parse the data as a json object

    var obj; // in the format of {cmd: "the-cmd", text: "the-text"}
    try {
      obj = JSON.parse(data.toString());
    } catch (e) {
      client.write(JSON.stringify({ type: "error", message: e.message }));
      return;
    }

    const decodedText = Buffer.from(obj.text, "base64").toString("utf8");

    // create the source file
    const sourceFile = ts.createSourceFile(
      "bleh.ts", // name does not matter until we save, which we don't from here
      decodedText,
      ts.ScriptTarget.Latest,
      true, // for setParentNodes
      ts.ScriptKind.TS
    );

    switch (obj.cmd) {
      // simply print out the text (and puts unknown types)
      case "print": {
        try {
          const res = printSource(sourceFile);
          const base64 = Buffer.from(res).toString("base64");
          client.write(
            JSON.stringify({
              type: "printResponse",
              text: base64,
            })
          );
        } catch (e) {
          client.write(JSON.stringify({ type: "error", message: e.message }));
        }

        break;
      }
      // generate the text tree from the given text (and puts unknown types)
      case "tree": {
        const res = makeTree(sourceFile);
        try {
          const base64 = Buffer.from(JSON.stringify(res)).toString("base64");
          client.write(
            JSON.stringify({
              type: "treeResponse",
              text: base64,
            })
          );
        } catch (e) {
          client.write(JSON.stringify({ type: "error", message: e.message }));
        }

        break;
      }
      // generate a stub for the given node (that is type-annotated)
      case "stub": {
        try {
          const res = stubSource(sourceFile);
          const base64 = Buffer.from(res).toString("base64");
          client.write(
            JSON.stringify({
              type: "stubResponse",
              text: base64,
            })
          );
        } catch (e) {
          client.write(JSON.stringify({ type: "error", message: e.message }));
        }

        break;
      }
      default: {
        client.write(
          JSON.stringify({
            type: "error",
            message: `unknown command ${obj.cmd}`,
          })
        );
      }
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
