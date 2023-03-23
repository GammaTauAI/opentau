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

<<<<<<< HEAD
/// Request to the incoder server with a given command and text
/// in the format of {code: <code>, retries: <number of retries>}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IncoderSocketReq {
    pub code: String,
    pub retries: usize,
}

fn permutations(input: Vec<Vec<String>>) -> Vec<Vec<String>> {
    let m = input[0].len();
    let mut output = Vec::new();
    let mut unique_strings = HashSet::new();

    for i in 0..m {
        let mut temp = Vec::new();
        for j in 0..input.len() {
            let current_string = input[j][i].clone();
            temp.push(current_string);
        }
        temp.sort();
        unique_strings.extend(temp.clone());

        if i == m - 1 {
            let mut all_permutations = unique_strings.into_iter().permutations(m).collect::<Vec<_>>();
            for permutation in all_permutations.iter_mut() {
                permutation.sort();
            }
            all_permutations.sort();

            for permutation in all_permutations {
                let mut new_row = Vec::new();
                for j in 0..m {
                    let mut new_string = String::new();
                    for k in 0..input.len() {
                        if input[k][j] == permutation[j] {
                            new_string = input[k][j].clone();
                            break;
                        }
                    }
                    new_row.push(new_string);
                }
                output.push(new_row);
            }
        }
    }
    output
=======
impl Default for IncoderClientBuilder {
    fn default() -> Self {
        Self::new()
    }
>>>>>>> main
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
        let code = query.input.clone();
        let problem_whitelist = query.problem_whitelist.clone();
        let req = IncoderSocketReq {
            code: base64::encode(&code),
            retries: query.num_comps,
        };

        tokio::task::spawn(async move {
        let resp: serde_json::Value = self.socket.send_req(&req).await.map_err(|e| ModelResponseError::InvalidResponse(e.to_string()))?;
        // the response is a base64 encoded string of a list of list of strings
        let decoded = base64::decode(resp).unwrap();
        let type_annotations_raw: Vec<Vec<String>> = serde_json::from_str(&decoded).unwrap();

        let type_annotations = Vec::new();
        for type_annotation_choices_raw in type_annotations_raw.into_iter() {
            let mut type_annotation_choices = Vec::new();
            for type_annotation_raw in type_annotation_choices_raw.into_iter() {
                // parse the type annotations
                let type_annotation = langserver::ts::ts_parse_type(&type_annotation_raw).await.unwrap();
                type_annotation_choices.push(type_annotation);
            }
            type_annotations.push(type_annotation_choices);
        }
        let type_annotation_permutations: Vec<Vec<String>> = permutations(type_annotations);
        
        let mut completions = Vec::new();
        for type_annotation_permutation in type_annotation_permutations.into_iter() {
            let mut new_code = code.clone();
            for type_annotation in type_annotation_permutation {
                // replace the first occurrence of "_hole_" with the type annotation
                if let Some(index) = new_code.find("_hole_") {
                    new_code.replace_range(index..index + type_annotation.len(), &type_annotation);
                }
            }
            completions.push(new_code);
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
