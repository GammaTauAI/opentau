use std::collections::HashSet;
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tokio::{io::AsyncBufReadExt, net::UnixStream, sync::Mutex, task::JoinHandle};

use crate::{
    debug, get_path_from_rootdir,
    langserver::{self, ts::ts_parse_type},
    socket::{SendToSocket, SingleThreadedSocket, SocketAbstraction, SocketPool},
};

use super::{filter_comps, CompletionEngine, CompletionModel, CompletionQuery, ModelResponseError};

pub struct LocalModelClient {
    /// Unix socket to communicate with the model server
    socket: Arc<dyn SendToSocket>,
}

pub struct LocalModelClientBuilder {
    kind: String, // e.g. incoder, or santacoder
    socket_path: Option<String>,
}

impl LocalModelClientBuilder {
    pub fn new(kind: String) -> Self {
        Self {
            kind,
            socket_path: None,
        }
    }

    pub fn socket_path(mut self, socket_path: String) -> Self {
        self.socket_path = Some(socket_path);
        self
    }

    pub async fn build(self) -> Result<LocalModelClient, ModelResponseError> {
        // if we have a socket path, use that. open a pool. split on
        // comma.
        if let Some(socket_path) = self.socket_path {
            let socket_paths = socket_path.split(',').map(|s| s.to_string()).collect();
            let pool = SocketPool::make(socket_paths).await;
            return Ok(LocalModelClient {
                socket: Arc::new(pool),
            });
        };

        // otherwise, we spawn a new server
        let model_path = format!(
            "{}/main.py",
            get_path_from_rootdir(format!("{}-server", self.kind))
        );
        let server_command_prefix = vec!["python3", &model_path];
        let socket = Arc::new(SingleThreadedSocket::new(
            SocketAbstraction::spawn_server(&self.kind, &server_command_prefix, false)
                .await
                .map_err(|e| ModelResponseError::InvalidResponse(e.to_string()))?,
        ));
        Ok(LocalModelClient { socket })
    }
}

/// Request to the local server with a given command and text
/// in the format of
/// {
///     code: <code>,
///     num_samples: <num_samples>,
///     temperature: <temperature>,
/// }
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalModelSocketReq {
    pub code: String,
    pub num_samples: usize,
    pub temperature: f64,
}

impl CompletionModel for LocalModelClient {
    fn spawn_comp(
        &self,
        query: &CompletionQuery,
        engine: &dyn CompletionEngine,
        filtered_completions: Arc<Mutex<Vec<(String, u16)>>>,
    ) -> JoinHandle<Result<(), ModelResponseError>> {
        let lang_client = engine.get_ls();
        let max_type_score = engine.get_max_type_score();
        let num_comps = query.num_comps;
        let code = query.input.clone();
        let problem_whitelist = query.problem_whitelist.clone();
        let socket = self.socket.clone();
        let temperature = engine.get_temperature();

        // count the number of _hole_'s in the code
        let num_holes = code.matches("_hole_").count();

        tokio::task::spawn(async move {
            let mut completions = Vec::with_capacity(num_comps);

            // first run, consider all that work
            let req = LocalModelSocketReq {
                code: code.clone(),
                num_samples: num_comps,
                temperature,
            };
            let resp: serde_json::Value = {
                socket
                    .send_req(serde_json::to_value(&req).unwrap())
                    .await
                    .map_err(|e| ModelResponseError::InvalidResponse(e.to_string()))?
            };

            let annots: Vec<String> =
                serde_json::from_value(resp["type_annotations"].clone()).unwrap();

            debug!("got annotations {annots:?}");
            for annot in annots {
                if let Some(parsed) = ts_parse_type(annot).await {
                    debug!("succesfully parsed into {parsed}");
                    let comp = code.replacen("_hole_", &parsed, 1);
                    debug!("current completion: {comp}");
                    completions.push(comp);
                }
            }

            'comp_loop: for mut completion in completions.into_iter() {
                for _ in 1..num_holes {
                    let req = LocalModelSocketReq {
                        code: completion.clone(),
                        num_samples: 5,
                        temperature,
                    };

                    let resp: serde_json::Value = {
                        socket
                            .send_req(serde_json::to_value(&req).unwrap())
                            .await
                            .map_err(|e| ModelResponseError::InvalidResponse(e.to_string()))?
                    };

                    let annots: Vec<String> =
                        serde_json::from_value(resp["type_annotations"].clone()).unwrap();

                    // get the first annot that parses
                    let mut solved = false;
                    debug!("got annotations {annots:?}");
                    for annot in annots {
                        if let Some(parsed) = ts_parse_type(annot).await {
                            debug!("succesfully parsed into {parsed}");
                            completion = completion.replacen("_hole_", &parsed, 1);
                            debug!("current completion: {completion}");
                            solved = true;
                            break;
                        }
                    }
                    if !solved {
                        continue 'comp_loop;
                    }
                }

                filter_comps(
                    filtered_completions.clone(),
                    lang_client.clone(),
                    &code,
                    completion,
                    problem_whitelist.clone(),
                    max_type_score,
                )
                .await?;
            }

            Ok(())
        })
    }
}