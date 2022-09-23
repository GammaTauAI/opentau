use std::process::Stdio;

use async_trait::async_trait;
use serde::Serialize;
use serde_json::json;
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt},
    net::UnixStream,
};

use crate::tree::CodeBlockTree;

use super::{socket_transaction, LCCheckReq, LCPrintReq, LCReq, LangClient, LangClientError};

#[derive(Debug)]
pub struct TsClient {
    pub socket_path: String,
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
            // stderr is open by default, we want to see the output
            .spawn()
        {
            Ok(p) => p,
            Err(_) => return Err(LangClientError::ProcessSpawn),
        };

        // before allowing to connect, wait for the process to output "Listening"
        {
            let stdout = process.stdout.as_mut().unwrap();
            let reader = tokio::io::BufReader::new(stdout);
            let mut lines = reader.lines();
            println!("client output:");
            while let Some(line) = lines.next_line().await.unwrap() {
                println!("{}", line);
                if line.contains("Listening") {
                    break;
                }
            }
        }

        println!("client ready to connect to socket!");
        let socket_path = tmp_socket_file.to_str().unwrap().to_string();
        Ok(Self {
            socket_path,
            process,
        })
    }

    async fn pretty_print(&self, code: &str, type_name: &str) -> Result<String, LangClientError> {
        let req = LCPrintReq {
            cmd: "print".to_string(),
            text: base64::encode(code),
            type_name: type_name.to_string(),
        };

        let resp = self.send_req(&req).await?;
        // decode the response
        let resp = base64::decode(resp["text"].as_str().unwrap()).unwrap();

        Ok(String::from_utf8(resp).unwrap())
    }

    async fn to_tree(&self, code: &str) -> Result<CodeBlockTree, LangClientError> {
        let req = LCReq {
            cmd: "tree".to_string(),
            text: base64::encode(code),
        };

        let resp = self.send_req(&req).await?;

        // decode the response
        let tree = base64::decode(resp["text"].as_str().unwrap()).unwrap();

        Ok(serde_json::from_slice(&tree).unwrap())
    }

    async fn stub(&self, code: &str) -> Result<String, LangClientError> {
        let req = LCReq {
            cmd: "stub".to_string(),
            text: base64::encode(code),
        };

        let resp = self.send_req(&req).await?;
        // decode the response
        let resp = base64::decode(resp["text"].as_str().unwrap()).unwrap();

        Ok(String::from_utf8(resp).unwrap())
    }

    async fn check_complete(
        &self,
        original: &str,
        completed: &str,
    ) -> Result<(bool, i64), LangClientError> {
        // encode original and completed into json: {original: "", completed: ""}
        let req = LCCheckReq {
            cmd: "check".to_string(),
            text: base64::encode(completed),
            original: base64::encode(original),
        };

        let resp = self.send_req(&req).await?;
        Ok((
            resp["text"].as_bool().unwrap(),
            resp["score"].as_i64().unwrap(),
        ))
    }

    async fn type_check(&self, code: &str) -> Result<bool, LangClientError> {
        // get a temp file (overwrite if exists)
        let tmp_dir = std::env::temp_dir();
        let tmp_file = tmp_dir.join(format!("codex-{}.ts", std::process::id()));
        tokio::fs::write(&tmp_file, code).await?;

        // run: tsc --allowJs --checkJs --noEmit filename.ts
        let mut process = match tokio::process::Command::new("tsc")
            .args([
                "--allowJs",
                "--checkJs",
                "--noEmit",
                tmp_file.to_str().unwrap(),
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
        {
            Ok(p) => p,
            Err(_) => return Err(LangClientError::ProcessSpawn),
        };

        // check if the process exited with code 0
        let status = process.wait().await?;
        Ok(status.success())
    }
}

impl TsClient {
    pub async fn send_req<T>(&self, req: &T) -> Result<serde_json::Value, LangClientError>
    where
        T: ?Sized + Serialize,
    {
        let buf = socket_transaction(&self.socket_path, &req).await?;

        // into json object
        let resp: serde_json::Value = serde_json::from_str(&buf).unwrap();

        // check if the response is not an error
        if resp["type"] == "error" {
            return Err(LangClientError::LC(resp["message"].to_string()));
        }

        Ok(resp)
    }
}
