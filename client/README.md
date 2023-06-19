# OpenTau Core

This is the Rust portion of the OpenTau project. It contains the core library
and an optional CLI tool. The documentation for the CLI tool can be displayed
by running `cargo run -- --help`. In this README, we will focus on the library
itself.

The code for the OpenTau project is split into two parts: the Rust library and
the TypeScript compiler library. The Rust library is responsible for the main
logic of the implementation, while the TypeScript library is responsible for
AST manipulation and analysis.

Here is a brief overview of the Rust library, where each file is located, and
what it does. Files that are not listed are either not important to our current
discussion or are self-explanatory.

## File Overview

#### `src/socket.rs`

This file contains a socket abstraction that enables low-level communication between the
Rust library, the TypeScript compiler server, and the SantaCoder model server.

#### `src/tree.rs`

This file contains the core of the OpenTau tree algorithm. It contains the
data structure itself, and the functions that manipulate it. The tree algorithm
is implemented in a parallel fashion, as each node in a tree level can be
processed independently of the others. This allows us to use a thread pool to
process each level of the tree in parallel.

#### `src/main_strategies.rs`

This is a file that contains two strategies for the OpenTau project. The first
strategy is our baseline strategy, which is a simple strategy that does not
utilize the tree algorithm, instead it treats a whole file as a single tree node.
The second strategy is our tree strategy, which utilizes the tree algorithm. This
is the entry point for the OpenTau library when used either by the evaluator or
the CLI tool.

### `src/completion.rs`

This file is a module that contains the structures and logic for the
completion of a single request. It contains multiple abstractions that
allow to easily add more completion providers in the future. Furthermore,
it contains additional abstractions that allow for multi-threaded completion
requests.

#### `src/completion/local.rs`

This file contains the logic for the local completion provider. This provider
is typically used for the SantaCoder model server. The provider is designed such that
more local servers can be added without needing to change the code in this file.

### `src/langserver.rs`

This files is a modules that contains an abstraction for communicating with
multiple language servers and compilers. It provides a simple interface for
seemingly sending requests and receiving responses from a language server.
The design of this module is such that it can be easily extended to support
more language servers and compilers in the future.

#### `src/langserver/ts.rs`

This file contains the implementation of the language server abstraction for
the TypeScript compiler server. A macro defined in `src/langserver.rs` is used
to implement most of the logic for the language server abstraction, and this
file only contains a few additional functions that are specific to the
TypeScript compiler server.
