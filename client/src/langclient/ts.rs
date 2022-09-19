use std::process::Stdio;

use async_trait::async_trait;
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt},
    net::UnixStream,
};

use super::{socket_transaction, LCReq, LangClient, LangClientError};

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

    async fn pretty_print(&mut self, code: &str) -> Result<String, LangClientError> {
        // base64 encode the code
        let code = base64::encode(code);

        let req = LCReq {
            cmd: "print".to_string(),
            text: code.to_string(),
        };

        let buf = socket_transaction(&self.socket_path, &req).await?;

        // into json object
        let resp: serde_json::Value = serde_json::from_str(&buf).unwrap();

        // check if the response is not an error
        if resp["type"] == "error" {
            return Err(LangClientError::LC(resp["message"].to_string()));
        }

        // decode the response
        let resp = base64::decode(resp["text"].as_str().unwrap()).unwrap();

        Ok(String::from_utf8(resp).unwrap())
    }

    async fn to_tree(&mut self, code: &str) -> Result<crate::tree::CodeBlockTree, LangClientError> {
        // base64 encode the code
        let code = base64::encode(code);

        let req = LCReq {
            cmd: "tree".to_string(),
            text: code.to_string(),
        };

        let buf = socket_transaction(&self.socket_path, &req).await?;

        // into json object
        let resp: serde_json::Value = serde_json::from_str(&buf).unwrap();

        // check if the response is not an error
        if resp["type"] == "error" {
            return Err(LangClientError::LC(resp["message"].to_string()));
        }

        // decode the response
        let tree = base64::decode(resp["text"].as_str().unwrap()).unwrap();

        Ok(serde_json::from_slice(&tree).unwrap())
    }
}
