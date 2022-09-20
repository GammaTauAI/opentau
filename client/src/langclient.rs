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

    // pretty print the given code, making all missing types the "_hole_" token
    async fn pretty_print(&self, code: &str) -> Result<String, LangClientError>;

    // transforms the given code into a tree of code blocks
    async fn to_tree(&self, code: &str) -> Result<CodeBlockTree, LangClientError>;

    // makes all functions/classes/methods that are one level deep into a stub
    async fn stub(&self, code: &str) -> Result<String, LangClientError>;

    // checks if the given code is complete
    async fn check_complete(&self, code: &str) -> Result<bool, LangClientError>;
}

// Request to the language client server, with a given command and text
// in the format of {cmd: "the-cmd", text: "the-text"}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LCReq {
    pub cmd: String,
    pub text: String,
}

pub async fn socket_transaction(socket_path: &str, req: &LCReq) -> Result<String, LangClientError> {
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
