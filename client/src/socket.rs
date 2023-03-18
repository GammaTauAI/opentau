use serde::Serialize;
use thiserror::Error;
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt},
    net::UnixStream,
};

#[derive(Debug)]
pub struct SocketAbstraction {
    pub socket_path: String,
    pub process: tokio::process::Child,
}

#[derive(Debug, Error)]
pub enum SocketError {
    #[error("IO error: {0}")]
    Io(#[from] tokio::io::Error),
    #[error("JSON error: {0}")]
    Serde(#[from] serde_json::Error),
    #[error("Service error: {0}")]
    Service(String),
}

impl SocketAbstraction {
    pub async fn send_req<T>(&self, req: &T) -> Result<serde_json::Value, SocketError>
    where
        T: ?Sized + Serialize,
    {
        let buf = socket_transaction(&self.socket_path, &req).await?;

        // into json object
        let resp: serde_json::Value = serde_json::from_str(&buf)?;

        // check if the response is not an error
        if resp["type"] == "error" {
            return Err(SocketError::Service(resp["message"].to_string()));
        }

        Ok(resp)
    }
}

pub async fn socket_transaction<T>(socket_path: &str, req: &T) -> Result<String, SocketError>
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
