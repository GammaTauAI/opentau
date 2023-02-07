use std::process::Stdio;

use async_trait::async_trait;
use tokio::io::AsyncBufReadExt;

use crate::{debug, impl_langserver_commands, tree::CodeBlockTree};

use super::{
    abstraction::SocketAbstraction, LSCheckReq, LSPrintReq, LSReq, LSUsagesReq, LSWeaveReq,
    LangServer, LangServerCommands, LangServerError,
};

#[derive(Debug)]
pub struct TsServer {
    socket: SocketAbstraction,
}

#[async_trait]
impl LangServer for TsServer {
    async fn make(server_path: &str) -> Result<Self, LangServerError> {
        let pid = std::process::id();
        let tmp_dir = std::env::temp_dir();
        let tmp_socket_file = tmp_dir.join(format!("codex-{pid}.sock"));
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
        // get a temp file (overwrite if exists)
        let tmp_dir = std::env::temp_dir();
        // get a random number
        let rand = rand::random::<u64>();
        let tmp_file = tmp_dir.join(format!("codex-{}-{}.ts", std::process::id(), rand));
        tokio::fs::write(&tmp_file, code).await?;

        // run: tsc --allowJs --checkJs --noEmit filename.ts
        let mut process = match tokio::process::Command::new("tsc")
            .args([
                "--allowJs",
                "--checkJs",
                "--noEmit",
                "--target",
                "es2022",
                tmp_file.to_str().unwrap(),
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
        {
            Ok(p) => p,
            Err(_) => return Err(LangServerError::ProcessSpawn),
        };

        // check if the process exited with code 0
        let status = process.wait().await?;
        Ok(status.success())
    }
}

// implement the LangServerCommands trait
impl_langserver_commands!(TsServer);
