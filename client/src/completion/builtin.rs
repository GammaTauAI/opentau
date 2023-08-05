use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tokio::{sync::Mutex, task::JoinHandle};

use crate::{
    debug, get_path_from_rootdir,
    langserver::ArcLangServer,
    socket::{SendToSocket, SingleThreadedSocket, SocketAbstraction, SocketPool},
};

use super::{filter_comps, CompletionEngine, CompletionModel, CompletionQuery, ModelResponseError};

#[derive(Debug, Clone)]
pub struct BuiltinClient {}

impl BuiltinClient {
    pub fn new() -> Self {
        Self {}
    }
}

impl Default for BuiltinClient {
    fn default() -> Self {
        Self::new()
    }
}

impl CompletionModel for BuiltinClient {
    fn spawn_comp(
        &self,
        query: &CompletionQuery,
        engine: &dyn CompletionEngine,
        filtered_completions: Arc<Mutex<Vec<(String, u16)>>>,
    ) -> JoinHandle<Result<(), ModelResponseError>> {
        let lang_client = engine.get_ls();
        let max_type_score = engine.get_max_type_score();
        let mut code = query.input.clone();
        // replace all `: _hole_` with nothing
        code = code.replace(": _hole_", "");
        let problem_whitelist = query.problem_whitelist.clone();
        tokio::task::spawn(async move {
            // by running weaving on the same code, we are essentially triggering the type inference
            // process in the typescript compiler.
            let completion = lang_client.weave(&code, &code, 0).await.unwrap();
            filter_comps(
                filtered_completions.clone(),
                lang_client.clone(),
                &code,
                completion,
                problem_whitelist.clone(),
                max_type_score,
            )
            .await?;
            Ok(())
        })
    }
}
