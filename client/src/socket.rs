use std::{collections::HashMap, sync::Arc};

use serde::Serialize;
use thiserror::Error;
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt},
    net::UnixStream,
    sync::{
        mpsc::{Receiver, Sender},
        Mutex,
    },
};

use crate::debug;

#[derive(Debug)]
pub struct SocketAbstraction {
    pub socket_path: String,
    pub process: Option<tokio::process::Child>,
}

#[derive(Debug)]
pub struct SingleThreadedSocket {
    socket: Mutex<SocketAbstraction>,
}

struct Worker {
    socket: Arc<SocketAbstraction>,
    avail_tx: Sender<String>,
}

/// A socket pool that can be used to delegate requests to multiple servers,
/// asynchronously.
pub struct SocketPool {
    workers: Arc<Mutex<HashMap<String, Worker>>>,
    avail_rx: Mutex<Receiver<String>>,
}

#[async_trait::async_trait]
pub trait SendToSocket: Send + Sync {
    /// Sends the given request to the server and returns the response as a JSON object.
    /// Expects the response to have a `type` field, and if it is `error`, returns an error.
    async fn send_req(&self, req: serde_json::Value) -> Result<serde_json::Value, SocketError>;
}

impl SocketPool {
    pub async fn make(socket_paths: Vec<String>) -> Self {
        let (avail_tx, avail_rx) = tokio::sync::mpsc::channel(socket_paths.len());
        let workers: HashMap<String, Worker> = socket_paths
            .into_iter()
            .map(|socket_path| {
                let socket = Arc::new(SocketAbstraction::new(socket_path.clone()));
                let avail_tx = avail_tx.clone();
                (socket_path, Worker { socket, avail_tx })
            })
            .collect();
        for socket_path in workers.keys() {
            avail_tx.send(socket_path.clone()).await.unwrap();
        }
        Self {
            workers: Arc::new(Mutex::new(workers)),
            avail_rx: Mutex::new(avail_rx),
        }
    }
}

#[async_trait::async_trait]
impl SendToSocket for SocketPool {
    /// Sends the given request to the server and returns the response as a JSON object.
    /// Expects the response to have a `type` field, and if it is `error`, returns an error.
    async fn send_req(&self, req: serde_json::Value) -> Result<serde_json::Value, SocketError> {
        let socket_name = {
            let mut avail_rx = self.avail_rx.lock().await;
            avail_rx.recv().await.unwrap()
        }
        .to_string();
        debug!("picked socket from pool: {}", socket_name);
        let (socket, avail) = {
            let workers = self.workers.lock().await;
            let worker = workers.get(&socket_name).unwrap();
            (worker.socket.clone(), worker.avail_tx.clone())
        };

        let resp = socket.send_req(req).await?;

        avail.send(socket_name).await.unwrap();

        Ok(resp)
    }
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
    /// Creates a new socket abstraction, does not spawn a process for it.
    /// The socket path is the path to the socket file, so we assume a
    /// server is already running.
    pub fn new(socket_path: String) -> Self {
        Self {
            socket_path,
            process: None,
        }
    }

    /// Spawns a new server process and returns a socket abstraction for it.
    /// The server command prefix is the prefix of the command to spawn the server.
    /// Does not include the last two args, which are the socket path and pid (optional).
    pub async fn spawn_server(
        name: &str,
        // This is the prefix of the command to spawn the server.
        // Does not include the last two args, which are the socket path and pid (optional).
        server_command_prefix: &[&str],
        pid_coordination: bool,
    ) -> Result<SocketAbstraction, SocketError> {
        let pid = std::process::id();
        let tmp_dir = std::env::temp_dir();
        let tmp_socket_file = tmp_dir.join(format!("{name}-{pid}.sock"));
        debug!("tmp_socket_file: {:?}", tmp_socket_file);

        let argv0 = server_command_prefix[0];
        let mut rest = server_command_prefix[1..]
            .iter()
            .map(|s| s.to_string())
            .collect::<Vec<_>>();
        rest.push(tmp_socket_file.to_str().unwrap().to_string());
        if pid_coordination {
            // add pid to the rest of the arguments
            rest.push(pid.to_string());
        }

        let mut process = tokio::process::Command::new(argv0)
            .args(rest)
            .stdout(std::process::Stdio::piped())
            // stderr is open by default, we want to see the output
            .spawn()?;

        // before allowing to connect, wait for the process to output "Listening"
        {
            let stdout = process.stdout.as_mut().unwrap();
            let reader = tokio::io::BufReader::new(stdout);
            let mut lines = reader.lines();
            debug!("{name} client output:");
            while let Some(line) = lines.next_line().await.unwrap() {
                debug!("{}", line);
                if line.contains("Listening") {
                    break;
                }
            }
        }

        debug!("client ready to connect to {name} socket!");
        let socket_path = tmp_socket_file.to_str().unwrap().to_string();
        let socket = SocketAbstraction {
            socket_path,
            process: Some(process),
        };
        Ok(socket)
    }

    async fn socket_transaction<T>(&self, req: &T) -> Result<String, SocketError>
    where
        T: ?Sized + Serialize,
    {
        let mut stream = UnixStream::connect(self.socket_path.to_string()).await?;
        let req = serde_json::to_string(req).unwrap();

        stream.write_all(req.as_bytes()).await?;
        stream.shutdown().await?;

        let mut reader = tokio::io::BufReader::new(&mut stream);
        let mut buf = String::new();
        reader.read_line(&mut buf).await?;
        Ok(buf)
    }
}

#[async_trait::async_trait]
impl SendToSocket for SocketAbstraction {
    /// Sends the given request to the server and returns the response as a JSON object.
    /// Expects the response to have a `type` field, and if it is `error`, returns an error.
    async fn send_req(&self, req: serde_json::Value) -> Result<serde_json::Value, SocketError> {
        let buf = self.socket_transaction(&req).await?;

        // into json object
        let resp: serde_json::Value = serde_json::from_str(&buf)?;

        // check if the response is not an error
        if resp["type"] == "error" {
            return Err(SocketError::Service(resp["message"].to_string()));
        }

        Ok(resp)
    }
}

impl SingleThreadedSocket {
    pub fn new(socket_abstraction: SocketAbstraction) -> Self {
        Self {
            socket: Mutex::new(socket_abstraction),
        }
    }
}

#[async_trait::async_trait]
impl SendToSocket for SingleThreadedSocket {
    /// Sends the given request to the server and returns the response as a JSON object.
    /// Expects the response to have a `type` field, and if it is `error`, returns an error.
    async fn send_req(&self, req: serde_json::Value) -> Result<serde_json::Value, SocketError> {
        let socket = self.socket.lock().await;
        socket.send_req(req).await
    }
}
