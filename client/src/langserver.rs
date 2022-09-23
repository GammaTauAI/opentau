use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt},
    net::UnixStream,
};

use crate::tree::CodeBlockTree;
pub mod ts; // the typescript server

// TODO:
// pub mod py; // the python server

// This is the trait that defines operations on the language server.
#[async_trait]
pub trait LangServer {
    // create a new server socket connection, given a path to the language server executable
    async fn make(path: &str) -> Result<Self, LangServerError>
    where
        Self: std::marker::Sized;

    // pretty print the given code, making all missing types the given type token
    async fn pretty_print(&self, code: &str, type_name: &str) -> Result<String, LangServerError>;

    // transforms the given code into a tree of code blocks
    async fn to_tree(&self, code: &str) -> Result<CodeBlockTree, LangServerError>;

    // makes all functions/classes/methods that are one level deep into a stub
    async fn stub(&self, code: &str) -> Result<String, LangServerError>;

    // checks if the given code is complete, comparing it to the original input
    async fn check_complete(
        &self,
        original: &str,
        completed: &str,
    ) -> Result<(bool, i64), LangServerError>;

    // type checks the given code. returns true if it type checks, false otherwise.
    // may return an error.
    async fn type_check(&self, code: &str) -> Result<bool, LangServerError>;
}

// Request to the language server, with a given command and text
// in the format of {cmd: "the-cmd", text: "the-text"}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LSReq {
    pub cmd: String,
    pub text: String,
}

// Request to the language server, for the printer command.
// in the format of {cmd: "the-cmd", text: "the-text", typeName: "the-type-name"}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LSPrintReq {
    pub cmd: String,
    pub text: String,
    #[serde(rename = "typeName")]
    pub type_name: String,
}

// Request to the language server, for the check command.
// in the format of {cmd: "the-cmd", text: "the-completed-text", original: "the-original-text"}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LSCheckReq {
    pub cmd: String,
    pub text: String,
    pub original: String,
}

pub async fn socket_transaction<T>(socket_path: &str, req: &T) -> Result<String, LangServerError>
where
    T: ?Sized + Serialize,
{
    let mut stream = UnixStream::connect(socket_path).await?;
    let req = serde_json::to_string(req).unwrap();

    stream.write_all(req.as_bytes()).await?;
    stream.shutdown().await?;

    let mut reader = tokio::io::BufReader::new(&mut stream);
    let mut buf = String::new();
    reader.read_line(&mut buf).await?;
    Ok(buf)
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
            LangServerError::LC(s) => write!(f, "Language client error: {}", s),
            LangServerError::ProcessSpawn => write!(f, "could not spawn language server"),
            LangServerError::SocketConnect => write!(f, "Socket connection error"),
            LangServerError::SocketIO => write!(f, "Socket IO error"),
        }
    }
}

impl std::error::Error for LangServerError {}
