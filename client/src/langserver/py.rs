

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

    async fn type_check(&self, _code: &str) -> Result<bool, LangServerError> {
        // TODO: implement this later, for now just return true
        //       this needs to be implemented before check, tree and stub, but after make and print
        Ok(true)
    }
}
