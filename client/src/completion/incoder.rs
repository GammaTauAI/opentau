use std::sync::Arc;

use tokio::{io::AsyncBufReadExt, net::UnixStream, sync::Mutex, task::JoinHandle};

use crate::{debug, get_path_from_rootdir, socket::SocketAbstraction};

use super::{CompletionEngine, CompletionModel, CompletionQuery, ModelResponseError};

pub struct IncoderClient {
    /// Unix socket to communicate with the model server
    socket: SocketAbstraction,
}

pub struct IncoderClientBuilder {
    socket_path: Option<String>,
}

impl IncoderClientBuilder {
    pub fn new() -> Self {
        Self { socket_path: None }
    }

    pub fn socket_path(mut self, socket_path: String) -> Self {
        self.socket_path = Some(socket_path);
        self
    }

    pub async fn build(self) -> Result<IncoderClient, ModelResponseError> {
        // if we have a socket path, use that
        if let Some(socket_path) = self.socket_path {
            return Ok(IncoderClient {
                socket: SocketAbstraction::new(socket_path),
            });
        };

        // otherwise, we spawn a new server
        let incoder_path = get_path_from_rootdir("incoder-server".to_string());
        let server_command_prefix = vec!["python3", &incoder_path];
        let socket = SocketAbstraction::spawn_server("incoder", &server_command_prefix, false)
            .await
            .expect("Failed to spawn incoder server");
        Ok(IncoderClient { socket })
    }
}

impl Default for IncoderClientBuilder {
    fn default() -> Self {
        Self::new()
    }
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
