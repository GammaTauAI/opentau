use std::sync::Arc;
use std::collections::HashSet;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use tokio::{
    io::AsyncBufReadExt,
    net::UnixStream,
    sync::Mutex,
    task::JoinHandle,
};

use crate::{debug, get_path_from_rootdir, socket::SocketAbstraction, langserver};

use super::{CompletionEngine, CompletionModel, CompletionQuery, ModelResponseError, filter_comps};

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

/// Request to the incoder server with a given command and text
/// in the format of {code: <code>, retries: <number of retries>}
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
        let temp = engine.get_temperature();
        let max_type_score = engine.get_max_type_score();
        let num_comps = query.num_comps;
        let mut code = query.input.clone();
        let problem_whitelist = query.problem_whitelist.clone();

        // count the number of _hole_'s in the code
        let num_holes = code.matches("_hole_").count();

        // vec of num_comps copies of the code
        let mut completions = vec![code.clone(); num_holes];

        let req = IncoderSocketReq {
            code: base64::encode(&code),
            num_samples: num_comps,
            should_infill_single: true,
        };
        tokio::task::spawn(async move {
            let resp: serde_json::Value = self.socket.send_req(&req).await.map_err(|e| ModelResponseError::InvalidResponse(e.to_string()))?;
        });
        let decoded = base64::decode(resp).unwrap();
        let all_choices: Vec<Vec<String>> = serde_json::from_str(&decoded).unwrap();
        let all_choices_parsed = Vec::with_capacity(num_comps);
        for type_annotation_choices_raw in all_choices.into_iter() {
            let type_annotation_choices = Vec::new();
            for type_annotation_choice_raw in type_annotation_choices_raw.into_iter() {
                let type_annotation_choice = langserver::ts::ts_parse_type(&type_annotation_raw).await.unwrap();
                type_annotation_choices.push(type_annotation_choice);
            }
            let type_annotation_choice = langserver::ts::ts_parse_type(&type_annotation_raw).await.unwrap();
            type_annotation_choices.push(type_annotation_choice);
        }

        // loop until there are no more _hole_'s in the code
        // - for first _hole_, we ask for `num_comps` samples
        // - for subsequent _hole_'s, we ask for 1 samples
        let mut cur_hole_idx = 0;
        while code.contains("_hole_") {
            // use 1 line if statement for num_samples
            let req = IncoderSocketReq {
                code: base64::encode(&code),
                num_samples: if cur_hole_idx == 0 { num_comps } else { 1 },
                should_infill_single: cur_hole_idx == 0,
            };
            tokio::task::spawn(async move {
                let resp: serde_json::Value = self.socket.send_req(&req).await.map_err(|e| ModelResponseError::InvalidResponse(e.to_string()))?;
            });
            let decoded = base64::decode(resp).unwrap();
            let type_annotation_choices_raw: Vec<String> = serde_json::from_str(&decoded).unwrap();

            // parse the type annotations
            let type_annotation_choices = Vec::new();
            for type_annotation_choice_raw in type_annotation_choices_raw.into_iter() {
                let type_annotation_choice = langserver::ts::ts_parse_type(&type_annotation_raw).await.unwrap();
                type_annotation_choices.push(type_annotation_choice);
            }

            // substitute the type annotations
        }
            

        for completion in completions.into_iter() {
            filter_comps(
                filtered_completions.clone(),
                lang_client.clone(),
                &code,
                completion,
                problem_whitelist.clone(),
                max_type_score
            )
            .await?;
        }
        Ok(())
        })
    }
}
