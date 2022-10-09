use std::process::Stdio;

use async_trait::async_trait;


use crate::tree::CodeBlockTree;

use super::{
    abstraction::SocketAbstraction, LangServer, LangServerError,
};

#[derive(Debug)]
pub struct PyServer {
    socket: SocketAbstraction,
}

#[async_trait]
impl LangServer for PyServer {
    async fn make(_path: &str) -> Result<Self, LangServerError>
    where
        Self: std::marker::Sized,
    {
        todo!("make py server. implement now")
    }

    async fn pretty_print(&self, _code: &str, _type_name: &str) -> Result<String, LangServerError> {
        todo!("pretty print py server. implement now")
    }

    async fn to_tree(&self, _code: &str) -> Result<CodeBlockTree, LangServerError> {
        todo!("tree py server. implement later")
    }

    async fn stub(&self, _code: &str) -> Result<String, LangServerError> {
        todo!("stub py server. implement later")
    }

    async fn check_complete(
        &self,
        _original: &str,
        _completed: &str,
    ) -> Result<(bool, i64), LangServerError> {
        // TODO: implement this later, for now just return true
        //       this needs to be implemented before tree and stub, but after make, print and
        //       type_check
        Ok((true, 0))
    }

    async fn type_check(&self, code: &str) -> Result<bool, LangServerError> {
        let tmp_dir = std::env::temp_dir();
        let tmp_file = tmp_dir.join(format!("codex-{}.py", std::process::id()));
        tokio::fs::write(&tmp_file, code).await?;

        // TODO: uses mypy for now, but pyright would be faster
        let mut process = match tokio::process::Command::new("mypy")
            .args([ tmp_file.to_str().unwrap() ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
        {
            Ok(p) => p,
            Err(_) => return Err(LangServerError::ProcessSpawn)
        };

        let status = process.wait().await?;
        Ok(status.success())
    }
}
