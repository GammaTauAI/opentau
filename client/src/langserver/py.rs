use std::process::Stdio;

use async_trait::async_trait;

use crate::tree::CodeBlockTree;

use super::{abstraction::SocketAbstraction, LangServer, LangServerError};

#[derive(Debug)]
pub struct PyServer {
    socket: SocketAbstraction,
}

#[async_trait]
impl LangServer for PyServer {
    async fn make(_path: &str) -> Result<Self, LangServerError> {
        // let pid = std::process::id();
        // let tmp_dir = std::env::temp_dir();
        // let tmp_socket_file = tmp_dir.join(format!("codex-{}.sock", pid));
        // println!("tmp_socket_file: {:?}", tmp_socket_file);

        // todo!("python server call");
        // let mut process = match tokio::process::Command::new("python")
        // .args([])
        // .stdout(Stdio::piped())
        // // stderr is open by default, we want to see the output
        // .spawn()
        // {
        // Ok(p) => p,
        // Err(_) => return Err(LangServerError::ProcessSpawn),
        // };

        // // before allowing to connect, wait for the process to output "Listening"
        // {
        // let stdout = process.stdout.as_mut().unwrap();
        // let reader = tokio::io::BufReader::new(stdout);
        // let mut lines = reader.lines();
        // println!("client output:");
        // while let Some(line) = lines.next_line().await.unwrap() {
        // println!("{}", line);
        // if line.contains("Listening") {
        // break;
        // }
        // }
        // }
        // println!("client ready to connect to socket!");
        // let socket_path = tmp_socket_file.to_str().unwrap().to_string();
        // let socket = SocketAbstraction {
        // socket_path,
        // process,
        // };
        // Ok(Self { socket })
        todo!()
    }

    async fn pretty_print(&self, code: &str, type_name: &str) -> Result<String, LangServerError> {
        // let req = LSPrintReq {
        // cmd: "print".to_string(),
        // text: base64::encode(code),
        // type_name: type_name.to_string(),
        // };

        // let resp = self.socket.send_req(&req).await?;
        // // decode the response
        // let resp = base64::decode(resp["text"].as_str().unwrap()).unwrap();

        // Ok(String::from_utf8(resp).unwrap())
        todo!()
    }

    async fn to_tree(&self, code: &str) -> Result<CodeBlockTree, LangServerError> {
        // let req = LSReq {
        // cmd: "tree".to_string(),
        // text: base64::encode(code),
        // };

        // let resp = self.socket.send_req(&req).await?;

        // // decode the response
        // let tree = base64::decode(resp["text"].as_str().unwrap()).unwrap();

        // Ok(serde_json::from_slice(&tree).unwrap())
        todo!()
    }

    async fn stub(&self, _code: &str) -> Result<String, LangServerError> {
        // let req = LSReq {
        // cmd: "stub".to_string(),
        // text: base64::encode(code),
        // };

        // let resp = self.socket.send_req(&req).await?;
        // // decode the response
        // let resp = base64::decode(resp["text"].as_str().unwrap()).unwrap();

        // Ok(String::from_utf8(resp).unwrap())
        todo!()
    }

    async fn check_complete(
        &self,
        _original: &str,
        _completed: &str,
    ) -> Result<(bool, i64), LangServerError> {
        // encode original and completed into json: {original: "", completed: ""}
        // let req = LSCheckReq {
        // cmd: "check".to_string(),
        // text: base64::encode(completed),
        // original: base64::encode(original),
        // };

        // let resp = self.socket.send_req(&req).await?;
        // Ok((
        // resp["text"].as_bool().unwrap(),
        // resp["score"].as_i64().unwrap(),
        // ))
        todo!()
    }

    async fn weave(
        &self,
        original: &str,
        nettle: &str,
        level: usize,
    ) -> Result<String, LangServerError> {
        todo!()
    }

    async fn type_check(&self, code: &str) -> Result<bool, LangServerError> {
        // let tmp_dir = std::env::temp_dir();
        // let tmp_file = tmp_dir.join(format!("codex-{}.py", std::process::id()));
        // tokio::fs::write(&tmp_file, code).await?;

        // // TODO: uses mypy for now, but pyright would be faster
        // let mut process = match tokio::process::Command::new("mypy")
        // .args([tmp_file.to_str().unwrap()])
        // .stdout(Stdio::piped())
        // .stderr(Stdio::piped())
        // .spawn()
        // {
        // Ok(p) => p,
        // Err(_) => return Err(LangServerError::ProcessSpawn),
        // };

        // let status = process.wait().await?;
        // Ok(status.success())
        todo!()
    }
}
