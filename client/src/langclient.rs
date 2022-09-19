use async_trait::async_trait;
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
}

#[derive(Debug, Clone)]
pub enum LangClientError {
    ProcessSpawnError,
    SocketConnectError,
}

impl std::fmt::Display for LangClientError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LangClientError::ProcessSpawnError => write!(f, "could not spawn language server"),
            LangClientError::SocketConnectError => write!(f, "Socket connection error"),
        }
    }
}

impl std::error::Error for LangClientError {}
