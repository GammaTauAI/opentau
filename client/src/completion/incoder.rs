use std::sync::Arc;

use tokio::{io::AsyncBufReadExt, net::UnixStream, sync::Mutex, task::JoinHandle};

use crate::{debug, socket::SocketAbstraction};

use super::{CompletionEngine, CompletionModel, CompletionQuery, ModelResponseError};

pub struct IncoderClient {
    /// Unix socket to communicate with the model server
    socket: SocketAbstraction,
}

pub struct IncoderClientBuilder {
    socket_path: String,
}

impl IncoderClientBuilder {
    pub fn new(socket_path: String) -> Self {
        Self { socket_path }
    }

    // pub async fn build(self) -> Result<IncoderClient, ModelResponseError> {
    // }
}

impl CompletionModel for IncoderClient {
    fn spawn_comp(
        &self,
        query: &CompletionQuery,
        engine: &dyn CompletionEngine,
        filtered_completions: Arc<Mutex<Vec<(String, u16)>>>,
    ) -> JoinHandle<Result<(), ModelResponseError>> {
        todo!()
    }
}
