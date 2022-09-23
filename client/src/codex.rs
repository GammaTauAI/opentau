use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tokio::{sync::Mutex, task::JoinHandle};

use crate::langserver::{LangServer, LangServerError};

pub struct CodexClient {
    pub client: reqwest::Client,
    pub token: String,
    // NOTE: mutex so that we make sure the socket is only used by one thread at a time
    pub lang_server: Arc<Mutex<dyn LangServer + Send + Sync>>,
    pub file_contents: String,
}

const INSTRUCTIONS: &str = "Substitute the token _hole_ with the correct type.";

impl CodexClient {
    /// Completes the given input code using the codex API. The given input code has to be pretty
    /// printed such that unknown types are represented by "_hole_".
    /// num_comps is the number of completions to return per request.
    /// retries is the number of requests to make to codex, which creates duplicates, so we filter
    /// them out.
    /// fallback is whether to fallback to "any" if we don't get any completions.
    pub async fn complete(
        &self,
        input: &str,
        num_comps: usize,
        mut retries: usize,
        fallback: bool,
    ) -> Result<Vec<String>, CodexError> {
        // we filter incomplete completions
        // scored vec: implemented scoring, sort resulting vec by score,
        //             and fall back to all "any" in worst case (if enabled)
        let filtered_completions: Arc<Mutex<Vec<(String, i64)>>> = Arc::new(Mutex::new(Vec::new()));
        let mut handles: Vec<JoinHandle<Result<(), CodexError>>> = Vec::new();

        while retries > 0 {
            let filtered_completions = Arc::clone(&filtered_completions);
            let lang_client = self.lang_server.clone();
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
                let choices: Vec<EditRespChoice> = match serde_json::from_str::<EditResp>(&body)? {
                    EditResp::Choices { choices } => choices,
                    EditResp::Error { error } => return Err(CodexError::ErrorResponse(error)),
                };

                println!("Got {} responses from codex", choices.len());

                let lang_client = lang_client.lock().await;
                for comp in choices.into_iter() {
                    let text = match comp {
                        EditRespChoice::Text { text } => text,
                        EditRespChoice::Error { error: e } => {
                            println!("Got error from codex: {}", e);
                            continue;
                        }
                    };

                    // check first if it's duplicate in our filtered completions
                    if filtered_completions.iter().any(|(c, _)| c == &text) {
                        continue;
                    }

                    let (is_complete, score) = lang_client
                        .check_complete(&input, &text)
                        .await
                        .unwrap_or_else(|e| {
                            println!("Error checking completion: {}", e);
                            (false, 0) // if there is an error, we assume it is not complete
                        });
                    if is_complete {
                        filtered_completions.push((text, score));
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
                if let CodexError::ErrorResponse(EditRespError::RateLimited { message: _ }) = &e {
                    println!("Rate limited by codex.");
                    rate_limited = true;
                }
                println!("Error in completion thread: {:?}", e);
            }
        }

        // sort the vec by score, low..high
        filtered_completions
            .lock()
            .await
            .sort_by(|(_, s1), (_, s2)| s1.cmp(s2));

        let mut final_completions = filtered_completions
            .lock()
            .await
            .iter()
            .map(|(c, _)| c.to_string())
            .collect::<Vec<String>>();

        if fallback {
            final_completions.push(
                self.lang_server
                    .lock()
                    .await
                    .pretty_print(input, "any")
                    .await?,
            );
        }

        if rate_limited {
            // if we rate limit, we still want to return the completions we have
            return Err(CodexError::RateLimit(final_completions));
        }

        // if we have no completions, we return an error
        if final_completions.is_empty() {
            return Err(CodexError::CodexCouldNotComplete);
        }

        // print out scores
        print!("Scores: ");
        for (_, score) in filtered_completions.lock().await.iter() {
            print!("{}, ", score);
        }
        println!();

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
#[serde(untagged)]
pub enum EditResp {
    Choices { choices: Vec<EditRespChoice> },
    Error { error: EditRespError },
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(untagged)]
pub enum EditRespChoice {
    Text { text: String },
    Error { error: EditRespError },
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(tag = "type")]
pub enum EditRespError {
    #[serde(rename = "invalid_edit")]
    InvalidEdit { message: String },
    #[serde(rename = "requests")]
    RateLimited { message: String },
}

impl std::fmt::Display for EditRespError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EditRespError::InvalidEdit { message } => write!(f, "Invalid edit: {}", message),
            EditRespError::RateLimited { message } => write!(f, "Rate limited: {}", message),
        }
    }
}

#[derive(Debug)]
pub enum CodexError {
    ErrorResponse(EditRespError),
    CodexCouldNotComplete,
    // where the Vec<String> is the list of completions we got before the rate limit
    RateLimit(Vec<String>),
    LangServer(LangServerError),
    Reqwest(reqwest::Error),
    Serde(serde_json::Error),
}

impl From<LangServerError> for CodexError {
    fn from(e: LangServerError) -> Self {
        CodexError::LangServer(e)
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
            CodexError::LangServer(e) => write!(f, "Language client error: {}", e),
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
