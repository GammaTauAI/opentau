use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tokio::{sync::Mutex, task::JoinHandle};

use crate::{
    debug, get_path_from_rootdir,
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
        let server_command_prefix = vec!["python3", &model_path, "--socket_path"];
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalModelSocketResp {
    #[serde(rename = "type")]
    pub type_: String,
    pub type_annotations: Vec<String>,
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
        let type_parser = lang_client.get_type_parser();

        // count the number of _hole_'s in the code
        let num_holes = code.matches("_hole_").count();

        tokio::task::spawn(async move {
            if num_holes == 0 {
                // nothing to do..
                return filter_comps(
                    filtered_completions.clone(),
                    lang_client.clone(),
                    &code,
                    code.clone(),
                    problem_whitelist.clone(),
                    max_type_score,
                )
                .await;
            }

            let mut completions = Vec::with_capacity(num_comps);

            // first run, consider all that work
            let req = LocalModelSocketReq {
                code: code.clone(),
                num_samples: num_comps,
                temperature,
            };

            let resp: LocalModelSocketResp =
                serde_json::from_value(socket.send_req(serde_json::to_value(&req)?).await?)?;

            debug!("got annotations {:?}", resp.type_annotations);
            for annot in resp.type_annotations {
                if let Some(parser) = &type_parser {
                    let parsed = parser(&annot).unwrap_or_else(|| {
                        debug!("failed to parse {annot}. falling back to any type :(");
                        lang_client.any_type()
                    });
                    debug!("succesfully parsed into {parsed}");
                    let comp = code.replacen("_hole_", &parsed, 1);
                    debug!("current completion: {comp}");
                    completions.push(comp);
                } else {
                    // if we don't have a parser, just pray that it's valid
                    let comp = code.replacen("_hole_", &annot, 1);
                    completions.push(comp);
                }
            }

            for mut completion in completions.into_iter() {
                for _ in 1..num_holes {
                    let req = LocalModelSocketReq {
                        code: completion.clone(),
                        // we don't use num_comps because here we only pick the first
                        // one that parses
                        num_samples: 3,
                        temperature,
                    };

                    let resp: LocalModelSocketResp = serde_json::from_value(
                        socket.send_req(serde_json::to_value(&req)?).await?,
                    )?;

                    // get the first annot that parses, or fallback to any
                    let mut solved = None;
                    debug!("got annotations {:?}", resp.type_annotations);
                    for annot in resp.type_annotations {
                        if let Some(parser) = &type_parser {
                            if let Some(parsed) = parser(&annot) {
                                debug!("succesfully parsed into {parsed}");
                                solved = Some(parsed);
                                break;
                            }
                        } else {
                            // if we don't have a parser, just pray that it's valid
                            solved = Some(annot);
                            break;
                        }
                    }

                    let solved = solved.unwrap_or_else(|| {
                        debug!("falling back to any type :(");
                        lang_client.any_type()
                    });
                    completion = completion.replacen("_hole_", &solved, 1);
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
