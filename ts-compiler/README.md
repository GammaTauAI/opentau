# TypeScript Compiler Infrastructure

This folder houses the TypeScript Compiler infrastructure that is used in OpenTau.
We use the TypeScript compiler whenever AST analysis or manipulation is required in our
type prediction and tree algorithm implementations. We briefly document here every
file in this folder. Files that are not documented are not currently used in OpenTau.

## Files

#### `main.ts`

This file contains the logic for the unix socket server that is used to enable communication
between the TypeScript compiler and the OpenTau Rust client. The server handles requests
from the client and sends back responses.

#### `check.ts`

This file contains the implementation of the typedness heuristic described in Section 3 of the paper.

#### `tree.ts`

This file contains the code for generating a code-block tree from a TypeScript AST. The code-block
tree is then used by OpenTau for type prediction.

#### `findUsages.ts`

This file contains the code to generate the usage statement comments for the tree algorithm.

#### `printer.ts`

This file contains the code that adds the `_hole_` type hole annotations to every un-annotated
declaration in the AST. These holes are then resolved by the SantaCoder server.

#### `weave.ts`

This file contains the code that transplants type annotations from one code block to another. This code
is used to transplant type annotations from children nodes in their parent nodes when running the tree
algorithm.

## Starting the TypeScript Compiler Server

The server does not need to be started manually. It is started automatically by the Rust client
when it is needed. However, if you want to start the server manually, you can do so by running
the following command:

```bash
npm start /tmp/typescript.sock 0
```
