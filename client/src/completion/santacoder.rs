use std::collections::HashSet;
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tokio::{io::AsyncBufReadExt, net::UnixStream, sync::Mutex, task::JoinHandle};

use crate::{
    debug, get_path_from_rootdir,
    langserver::{self, ts::ts_parse_type},
    socket::SocketAbstraction,
};

use super::{filter_comps, CompletionEngine, CompletionModel, CompletionQuery, ModelResponseError};

pub struct SantacoderClient {
    /// Unix socket to communicate with the model server
    ///
    /// TODO: change mutex to semaphore
    socket: Arc<Mutex<SocketAbstraction>>,
}

pub struct SantacoderClientBuilder {
    socket_path: Option<String>,
}

impl SantacoderClientBuilder {
    pub fn new() -> Self {
        Self { socket_path: None }
    }

    pub fn socket_path(mut self, socket_path: String) -> Self {
        self.socket_path = Some(socket_path);
        self
    }

    pub async fn build(self) -> Result<SantacoderClient, ModelResponseError> {
        // if we have a socket path, use that
        if let Some(socket_path) = self.socket_path {
            return Ok(SantacoderClient {
                socket: Arc::new(Mutex::new(SocketAbstraction::new(socket_path))),
            });
        };

        // otherwise, we spawn a new server
        let incoder_path = format!(
            "{}/main.py",
            get_path_from_rootdir("incoder-server".to_string())
        );
        let server_command_prefix = vec!["python3", &incoder_path];
        let socket = Arc::new(Mutex::new(
            SocketAbstraction::spawn_server("incoder", &server_command_prefix, false)
                .await
                .expect("Failed to spawn incoder server"),
        ));
        Ok(SantacoderClient { socket })
    }
}

impl Default for SantacoderClientBuilder {
    fn default() -> Self {
        Self::new()
    }
}

/// Request to the incoder server with a given command and text
/// in the format of
/// {
///     code: <code>,
///     samples: <number of samples>,
/// }
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SantacoderSocketReq {
    pub code: String,
    pub num_samples: usize,
}

impl CompletionModel for SantacoderClient {
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

        // count the number of _hole_'s in the code
        let num_holes = code.matches("_hole_").count();

        tokio::task::spawn(async move {
            let mut completions = Vec::with_capacity(num_comps);

            // first run, consider all that work
            let req = SantacoderSocketReq {
                code: code.clone(),
                num_samples: num_comps,
            };
            let resp: serde_json::Value = {
                socket
                    .lock()
                    .await
                    .send_req(&req)
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
                    let req = SantacoderSocketReq {
                        code: completion.clone(),
                        num_samples: 5,
                    };

                    let resp: serde_json::Value = {
                        socket
                            .lock()
                            .await
                            .send_req(&req)
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
