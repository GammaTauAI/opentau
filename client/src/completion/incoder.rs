use std::collections::HashSet;
use std::sync::Arc;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use tokio::{io::AsyncBufReadExt, net::UnixStream, sync::Mutex, task::JoinHandle};

use crate::{
    debug, get_path_from_rootdir, langserver,
    socket::{SendToSocket, SocketAbstraction},
};

use super::{filter_comps, CompletionEngine, CompletionModel, CompletionQuery, ModelResponseError};

pub struct IncoderClient {
    /// Unix socket to communicate with the model server
    socket: Arc<dyn SendToSocket>,
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
                socket: Arc::new(SocketAbstraction::new(socket_path)),
            });
        };

        // otherwise, we spawn a new server
        let incoder_path = format!(
            "{}/main.py",
            get_path_from_rootdir("incoder-server".to_string())
        );
        let server_command_prefix = vec!["python3", &incoder_path];
        let socket = Arc::new(
            SocketAbstraction::spawn_server("incoder", &server_command_prefix, false)
                .await
                .expect("Failed to spawn incoder server"),
        );
        Ok(IncoderClient { socket })
    }
}

impl Default for IncoderClientBuilder {
    fn default() -> Self {
        Self::new()
    }
}

/// Request to the incoder server with a given command and text
/// in the format of
/// {
///     code: <code>,
///     samples: <number of samples>,
///     should_infill_single: <bool>,
/// }
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IncoderSocketReq {
    pub code: String,
    pub num_samples: usize,
    pub should_infill_single: bool,
}

impl CompletionModel for IncoderClient {
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
            // vec of num_comps copies of the code
            let mut completions = vec![code.clone(); num_holes];

            let req = IncoderSocketReq {
                code: base64::encode(&code),
                num_samples: num_comps,
                should_infill_single: false,
            };
            let resp: serde_json::Value = socket
                .send_req(serde_json::to_value(&req).unwrap())
                .await
                .map_err(|e| ModelResponseError::InvalidResponse(e.to_string()))?;
            let all_choices: Vec<Vec<String>> =
                serde_json::from_value(resp["type_annotations"].clone()).unwrap();
            // track index too
            for (i, choices) in all_choices.iter().enumerate() {
                // always length of 1
                if let Some(choice) = choices.get(0) {
                    let type_annotation_choice = langserver::ts::ts_parse_type(choice.to_string())
                        .await
                        .unwrap();
                    // replace the first occurrence of "_hole_" in completions[i] with the type annotation
                    completions[i] = completions[i].replacen("_hole_", &type_annotation_choice, 1);
                }
                // substitute the first occurrence of _hole_ with the type annotation
            }

            // loop until there are no more _hole_'s in the code
            // - for subsequent _hole_'s, we ask for 1 sample
            for _ in 1..num_holes {
                let req = IncoderSocketReq {
                    code: base64::encode(&code),
                    num_samples: 1,
                    should_infill_single: true,
                };
                let resp: serde_json::Value = socket
                    .send_req(serde_json::to_value(&req).unwrap())
                    .await
                    .map_err(|e| ModelResponseError::InvalidResponse(e.to_string()))?;
                let type_annotation_choices_raw: Vec<String> =
                    serde_json::from_value(resp["type_annotations"].clone()).unwrap();
                for (i, type_annotation_choice_raw) in
                    type_annotation_choices_raw.iter().enumerate()
                {
                    if let type_annotation_choice =
                        langserver::ts::ts_parse_type(type_annotation_choice_raw.to_string())
                            .await
                            .unwrap()
                    {
                        completions[i] =
                            completions[i].replacen("_hole_", &type_annotation_choice, 1);
                    }
                }
            }

            for completion in completions.into_iter() {
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
