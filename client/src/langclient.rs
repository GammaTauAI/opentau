use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt},
    net::UnixStream,
};

use crate::tree::CodeBlockTree;
pub mod ts; // the typescript client

// TODO:
// pub mod py; // the python client

// This is the trait that defines operations on the language server client.
#[async_trait]
pub trait LangClient {
    // create a new client, given a path to the language server executable
    async fn make(client_path: &str) -> Result<Self, LangClientError>
    where
        Self: std::marker::Sized;

    // pretty print the given code, making all missing types the given type token
    async fn pretty_print(&self, code: &str, type_name: &str) -> Result<String, LangClientError>;

    // transforms the given code into a tree of code blocks
    async fn to_tree(&self, code: &str) -> Result<CodeBlockTree, LangClientError>;

    // makes all functions/classes/methods that are one level deep into a stub
    async fn stub(&self, code: &str) -> Result<String, LangClientError>;

    // checks if the given code is complete, comparing it to the original input
    async fn check_complete(
        &self,
        original: &str,
        completed: &str,
    ) -> Result<bool, LangClientError>;
}

// Request to the language client server, with a given command and text
// in the format of {cmd: "the-cmd", text: "the-text"}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LCReq {
    pub cmd: String,
    pub text: String,
}

// Request to the language client server, for the printer command.
// in the format of {cmd: "the-cmd", text: "the-text", typeName: "the-type-name"}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LCPrintReq {
    pub cmd: String,
    pub text: String,
    #[serde(rename = "typeName")]
    pub type_name: String,
}

// Request to the language client server, for the check command.
// in the format of {cmd: "the-cmd", text: "the-completed-text", original: "the-original-text"}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LCCheckReq {
    pub cmd: String,
    pub text: String,
    pub original: String,
}

pub async fn socket_transaction<T>(socket_path: &str, req: &T) -> Result<String, LangClientError>
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
pub enum LangClientError {
    LC(String), // actual error from the language client
    ProcessSpawn,
    SocketConnect,
    SocketIO,
}

impl From<std::io::Error> for LangClientError {
    fn from(_: std::io::Error) -> Self {
        LangClientError::SocketIO
    }
}

impl std::fmt::Display for LangClientError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LangClientError::LC(s) => write!(f, "Language client error: {}", s),
            LangClientError::ProcessSpawn => write!(f, "could not spawn language server"),
            LangClientError::SocketConnect => write!(f, "Socket connection error"),
            LangClientError::SocketIO => write!(f, "Socket IO error"),
        }
    }
}

impl std::error::Error for LangClientError {}
