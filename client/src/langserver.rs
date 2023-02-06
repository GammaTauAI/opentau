use std::sync::Arc;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use crate::tree::CodeBlockTree;
mod abstraction; // the socket abstraction
pub mod py; // the python server
pub mod ts; // the typescript server

/// This is the trait that defines operations on the language server.
#[async_trait]
pub trait LangServer {
    /// create a new server socket connection, given a path to the language server executable
    async fn make(path: &str) -> Result<Self, LangServerError>
    where
        Self: std::marker::Sized;

    /// pretty print the given code, making all missing types the given type token
    async fn pretty_print(&self, code: &str, type_name: &str) -> Result<String, LangServerError>;

    /// transforms the given code into a tree of code blocks
    async fn to_tree(&self, code: &str) -> Result<CodeBlockTree, LangServerError>;

    /// makes all functions/classes/methods that are one level deep into a stub
    async fn stub(&self, code: &str) -> Result<String, LangServerError>;

    /// checks if the given code is complete, comparing it to the original input
    async fn check_complete(
        &self,
        original: &str,
        completed: &str,
    ) -> Result<(bool, i64), LangServerError>;

    /// performs a type weaving operation on the given `original` code, such that the types of the
    /// `nettle` code are transplanted into the `original` code. The `level` parameter specifies the
    /// level of the tree where the `nettle` block is located relative to `original`.
    async fn weave(
        &self,
        original: &str,
        nettle: &str,
        level: usize,
    ) -> Result<String, LangServerError>;

    /// Produces a code block of usages of the given code block.
    ///
    /// # Example
    /// if you have the following `outer_block`:
    /// ```ts
    /// function hello(name) {
    ///     return "hello " + name + "!";
    /// }
    /// console.log(hello("world"));
    /// console.log(hello("Federico"));
    /// ```
    /// You should give as `inner_block` the following code:
    /// ```ts
    /// function hello(name) {
    ///    return "hello " + name + "!";
    /// }
    /// ```
    /// And you will be returned the following code:
    /// ```ts
    /// // Usages of hello are shown below:
    /// console.log(hello("world"));
    /// console.log(hello("Federico"));
    /// ```
    async fn usages(&self, outer_block: &str, inner_block: &str)
        -> Result<String, LangServerError>;

    /// type checks the given code. returns true if it type checks, false otherwise.
    /// may return an error.
    async fn type_check(&self, code: &str) -> Result<bool, LangServerError>;
}

pub type ArcLangServer = Arc<dyn LangServer + Send + Sync>;

/// Request to the language server, with a given command and text
/// in the format of {cmd: "the-cmd", text: "the-text"}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LSReq {
    pub cmd: String,
    pub text: String,
}

/// Request to the language server, for the printer command.
/// in the format of {cmd: "the-cmd", text: "the-text", typeName: "the-type-name"}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LSPrintReq {
    pub cmd: String,
    pub text: String,
    #[serde(rename = "typeName")]
    pub type_name: String,
}

/// Request to the language server, for the check command.
/// in the format of {cmd: "the-cmd", text: "the-completed-text", original: "the-original-text"}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LSCheckReq {
    pub cmd: String,
    pub text: String,
    pub original: String,
}

/// Request to the language server, for the weave command.
/// in the format of {cmd: "the-cmd", text: "the-original-text",
///                   nettle: "the-nettle-text", level: 0}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LSWeaveReq {
    pub cmd: String,
    pub text: String,
    pub nettle: String,
    pub level: usize,
}

/// Request to the language server, for the usages command.
/// in the format of {cmd: "the-cmd", text: "the-outer-block",
///                   innerBlcok: "the-inner-block"}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LSUsagesReq {
    pub cmd: String,
    pub text: String, // NOTE: this is outer_block
    #[serde(rename = "innerBlock")]
    pub inner_block: String,
}

#[derive(Debug, Clone)]
pub enum LangServerError {
    LC(String), // actual error from the language client
    ProcessSpawn,
    SocketConnect,
    SocketIO,
}

impl From<std::io::Error> for LangServerError {
    fn from(_: std::io::Error) -> Self {
        LangServerError::SocketIO
    }
}

impl std::fmt::Display for LangServerError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LangServerError::LC(s) => write!(f, "Language client error: {s}"),
            LangServerError::ProcessSpawn => write!(f, "could not spawn language server"),
            LangServerError::SocketConnect => write!(f, "Socket connection error"),
            LangServerError::SocketIO => write!(f, "Socket IO error"),
        }
    }
}

impl std::error::Error for LangServerError {}
