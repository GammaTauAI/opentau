use async_trait::async_trait;
use serde::{Deserialize, Serialize};
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

    // pretty print the given code, making all missing types the "***" token
    async fn pretty_print(&mut self, code: &str) -> Result<String, LangClientError>;
}

// Request to the language client server, with a given command and text
// in the format of {cmd: "the-cmd", text: "the-text"}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LCReq {
    pub cmd: String,
    pub text: String,
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
