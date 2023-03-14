use std::process::Stdio;

use async_trait::async_trait;
use tokio::io::AsyncBufReadExt;

use crate::{debug, impl_langserver_commands};

use super::{abstraction::SocketAbstraction, LSReq, LangServer, LangServerError};

#[derive(Debug)]
pub struct TsServer {
    socket: SocketAbstraction,
}

#[async_trait]
impl LangServer for TsServer {
    async fn make(server_path: &str) -> Result<Self, LangServerError> {
        let pid = std::process::id();
        let tmp_dir = std::env::temp_dir();
        let tmp_socket_file = tmp_dir.join(format!("opentau-ls-{pid}.sock"));
        debug!("tmp_socket_file: {:?}", tmp_socket_file);

        let mut process = match tokio::process::Command::new("npm")
            .args([
                "--prefix",
                server_path,
                "start",
                tmp_socket_file.to_str().unwrap(),
                pid.to_string().as_str(),
            ])
            .stdout(Stdio::piped())
            // stderr is open by default, we want to see the output
            .spawn()
        {
            Ok(p) => p,
            Err(_) => return Err(LangServerError::ProcessSpawn),
        };

        // before allowing to connect, wait for the process to output "Listening"
        {
            let stdout = process.stdout.as_mut().unwrap();
            let reader = tokio::io::BufReader::new(stdout);
            let mut lines = reader.lines();
            debug!("client output:");
            while let Some(line) = lines.next_line().await.unwrap() {
                debug!("{}", line);
                if line.contains("Listening") {
                    break;
                }
            }
        }

        debug!("client ready to connect to socket!");
        let socket_path = tmp_socket_file.to_str().unwrap().to_string();
        let socket = SocketAbstraction {
            socket_path,
            process,
        };
        Ok(Self { socket })
    }

    async fn type_check(&self, code: &str) -> Result<bool, LangServerError> {
        // for typescript, we use the language server for typechecking
        let req = LSReq {
            cmd: "typecheck".to_string(),
            text: base64::encode(code),
        };
        let resp = self.socket.send_req(&req).await?;

        let errors: usize = resp["errors"].as_u64().unwrap() as usize;
        Ok(errors == 0)
    }

    fn any_type(&self) -> String {
        "any".to_string()
    }
}

// implement the LangServerCommands trait
impl_langserver_commands!(TsServer);
