use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tokio::{sync::Mutex, task::JoinHandle};

use crate::langclient::{LangClient, LangClientError};

pub struct CodexClient {
    pub client: reqwest::Client,
    pub token: String,
    // NOTE: mutex so that we make sure the socket is only used by one thread at a time
    pub lang_client: Arc<Mutex<dyn LangClient + Send + Sync>>,
    pub file_contents: String,
}

const INSTRUCTIONS: &str = "Substitute the token _hole_ with the correct type.";

impl CodexClient {
    /// Completes the given input code using the codex API. The given input code has to be pretty
    /// printed such that unknown types are represented by "_hole_".
    /// num_comps is the number of completions to return per request. Codex will fail completely if
    /// it cannot give you the exact number of completions you ask for. retries is the number of
    /// requests to make to codex. There is a rate-limit of 20 requests per minute.
    pub async fn complete(
        &self,
        input: &str,
        num_comps: usize,
        mut retries: usize,
    ) -> Result<Vec<String>, CodexError> {
        // TODO: fall back to "any" in worst case

        // we filter incomplete completions
        let filtered_completions: Arc<Mutex<Vec<String>>> = Arc::new(Mutex::new(Vec::new()));
        let mut handles: Vec<JoinHandle<Result<(), CodexError>>> = Vec::new();

        while retries > 0 {
            let filtered_completions = Arc::clone(&filtered_completions);
            let lang_client = self.lang_client.clone();
            let input = input.to_string();
            let client = self.client.clone(); // NOTE: reqwest uses Arc internally
            let token = self.token.clone();

            handles.push(tokio::spawn(async move {
                let mut filtered_completions = filtered_completions.lock().await;
                let req = client
                    .post("https://api.openai.com/v1/edits")
                    .bearer_auth(token)
                    .header("Content-Type", "application/json")
                    .body(serde_json::to_string(&EditReq {
                        model: "code-davinci-edit-001".to_string(),
                        input: input.to_string(),
                        n: num_comps,
                        instruction: INSTRUCTIONS.to_string(),
                    })?)
                    .timeout(std::time::Duration::from_secs(30));
                let res = req.send().await?;
                let body = res.text().await?;
                let resp: EditResp = match serde_json::from_str(&body) {
                    Ok(p) => p,
                    // this means it's an error response.
                    Err(_) => return Err(CodexError::ErrorResponse(body)),
                };

                let lang_client = lang_client.lock().await;
                for comp in resp.choices.into_iter() {
                    // check first if it's duplicate in our filtered completions
                    if filtered_completions.contains(&comp.text) {
                        continue;
                    }
                    let is_complete = lang_client
                        .check_complete(&input, &comp.text)
                        .await
                        .unwrap_or_else(|e| {
                            println!("Error checking completion: {}", e);
                            false // if there is an error, we assume it is not complete
                        });
                    if is_complete {
                        filtered_completions.push(comp.text);
                    }
                }

                Ok(())
            }));

            retries -= 1;
        }

        let mut rate_limited = false;

        for handle in handles {
            let res = handle.await.unwrap();
            if let Err(e) = res {
                if let CodexError::ErrorResponse(body) = &e {
                    if body.contains("Rate limit reached") {
                        println!("Rate limited by codex.");
                        rate_limited = true;
                    }
                }
                println!("Error in completion thread: {:?}", e);
            }
        }

        let final_completions = filtered_completions.lock().await.to_vec();

        if rate_limited {
            // if we rate limit, we still want to return the completions we have
            return Err(CodexError::RateLimit(final_completions));
        }

        if final_completions.is_empty() {
            return Err(CodexError::CodexCouldNotComplete);
        }

        Ok(final_completions)
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct EditReq {
    pub model: String,
    pub input: String,
    pub instruction: String,
    pub n: usize,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct EditResp {
    pub choices: Vec<EditRespChoice>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct EditRespChoice {
    pub text: String,
    pub index: usize,
}

impl std::fmt::Display for EditResp {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        writeln!(f, "Choices given: ")?;
        for choice in &self.choices {
            writeln!(f, "- {}:\n{}", choice.index, choice.text)?;
        }
        Ok(())
    }
}

#[derive(Debug)]
pub enum CodexError {
    ErrorResponse(String),
    CodexCouldNotComplete,
    // where the Vec<String> is the list of completions we got before the rate limit
    RateLimit(Vec<String>),
    LangClient(LangClientError),
    Reqwest(reqwest::Error),
    Serde(serde_json::Error),
}

impl From<LangClientError> for CodexError {
    fn from(e: LangClientError) -> Self {
        CodexError::LangClient(e)
    }
}

impl From<reqwest::Error> for CodexError {
    fn from(e: reqwest::Error) -> Self {
        CodexError::Reqwest(e)
    }
}

impl From<serde_json::Error> for CodexError {
    fn from(e: serde_json::Error) -> Self {
        CodexError::Serde(e)
    }
}

impl std::fmt::Display for CodexError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CodexError::LangClient(e) => write!(f, "Language client error: {}", e),
            CodexError::Reqwest(e) => write!(f, "Reqwest error: {}", e),
            CodexError::Serde(e) => write!(f, "Serde error: {}", e),
            CodexError::ErrorResponse(s) => write!(f, "Codex error response: {}", s),
            CodexError::CodexCouldNotComplete => write!(f, "Codex could not complete"),
            CodexError::RateLimit(completions) => {
                write!(f, "Codex rate limit. Got {} completions", completions.len())
            }
        }
    }
}

impl std::error::Error for CodexError {}
