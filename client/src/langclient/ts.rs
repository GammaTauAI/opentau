use std::process::Stdio;

use async_trait::async_trait;
use tokio::{
    io::{AsyncBufReadExt, AsyncReadExt},
    net::UnixStream,
};

use super::{LangClient, LangClientError};

#[derive(Debug)]
pub struct TsClient {
    pub socket: UnixStream,
    pub process: tokio::process::Child,
}

#[async_trait]
impl LangClient for TsClient {
    async fn make(client_path: &str) -> Result<Self, LangClientError> {
        let pid = std::process::id();
        let tmp_dir = std::env::temp_dir();
        let tmp_socket_file = tmp_dir.join(format!("codex-{}.sock", pid));
        println!("tmp_socket_file: {:?}", tmp_socket_file);

        let mut process = match tokio::process::Command::new("npm")
            .args([
                "--prefix",
                client_path,
                "start",
                tmp_socket_file.to_str().unwrap(),
                pid.to_string().as_str(),
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
        {
            Ok(p) => p,
            Err(_) => return Err(LangClientError::ProcessSpawnError),
        };

        // before connecting, wait for the process to output "Listening"
        {
            let stdout = process.stdout.as_mut().unwrap();
            let reader = tokio::io::BufReader::new(stdout);
            let mut lines = reader.lines();
            println!("client ouput:");
            while let Some(line) = lines.next_line().await.unwrap() {
                println!("{}", line);
                if line.contains("Listening") {
                    break;
                }
            }
        }

        let socket = UnixStream::connect(tmp_socket_file).await;
        println!("connected to socket!");

        match socket {
            Ok(socket) => Ok(TsClient { socket, process }),
            Err(_) => Err(LangClientError::SocketConnectError),
        }
    }
}
