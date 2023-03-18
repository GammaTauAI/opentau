use serde::Serialize;
use thiserror::Error;
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt},
    net::UnixStream,
};

use crate::debug;

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
            process,
        };
        Ok(socket)
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
