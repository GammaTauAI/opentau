import ts from "typescript";
import { printSource } from "./printer";
import * as net from "net";

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

    switch (obj.cmd) {
      // simply print out the text (and puts unknown types)
      case "print": {
        // create the source file
        const sourceFile = ts.createSourceFile(
          "bleh.ts", // name does not matter until we save, which we don't from here
          obj.text,
          ts.ScriptTarget.Latest,
          false, // for setParentNodes TODO: maybe let's set this to true?
          ts.ScriptKind.TS
        );

        try {
          client.write(
            JSON.stringify({
              type: "printResponse",
              text: printSource(sourceFile),
            })
          );
        } catch (e) {
          client.write(JSON.stringify({ type: "error", message: e.message }));
        }

        break;
      }
      // generate the text tree from the given text (and puts unknown types)
      case "tree": {
        // TODO
      }
      // generate a stub for the given node (that is type-annotated)
      case "stub": {
        // TODO
      }
      default: {
        client.write(
          JSON.stringify({ type: "error", message: `unknown command ${obj.cmd}` })
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
