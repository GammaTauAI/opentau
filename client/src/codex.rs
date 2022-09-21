use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

use crate::langclient::{LangClient, LangClientError};

pub struct CodexClient {
    pub client: reqwest::Client,
    pub token: String,
    // NOTE: mutex so that we make sure the socket is only used by one thread at a time
    pub lang_client: Box<Mutex<dyn LangClient>>,
    pub file_contents: String,
}

impl CodexClient {
    /// Completes the given input code using the codex API. The given input code has to be pretty
    /// printed such that unknown types are represented by "***".
    pub async fn complete(
        &self,
        input: &str,
        num_comps: usize,
        mut retries: usize,
    ) -> Result<EditResp, CodexError> {
        // TODO: change such that we concurrently send requests to codex for n retries
        while retries > 0 {
            let req = self
                .client
                .post("https://api.openai.com/v1/edits")
                .bearer_auth(&self.token)
                .header("Content-Type", "application/json")
                .body(serde_json::to_string(&EditReq {
                    model: "code-davinci-edit-001".to_string(),
                    input: input.to_string(),
                    n: num_comps,
                    instruction: "Substitute the token _hole_ with the correct type.".to_string(),
                })?);
            let res = req.send().await?;
            let body = res.text().await?;
            let mut resp: EditResp = match serde_json::from_str(&body) {
                Ok(x) => x,
                Err(_) => continue,
            };

            let lang_client = self.lang_client.lock().await;
            // we filter incomplete completions
            let mut filtered_completions = Vec::new();
            for comp in resp.choices.into_iter() {
                let is_complete = lang_client
                    .check_complete(input, &comp.text)
                    .await
                    .unwrap_or_else(|e| {
                        println!("Error checking completion: {:?}", e);
                        false // if there is an error, we assume it is not complete
                    });
                if is_complete {
                    filtered_completions.push(comp);
                }
            }

            resp.choices = filtered_completions;
            if !resp.choices.is_empty() {
                return Ok(resp);
            }

            println!("No completions found, retrying...");

            retries -= 1;
        }
        Err(CodexError::CodexError)
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
    CodexError,
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
            CodexError::CodexError => write!(f, "Codex error"),
        }
    }
}

impl std::error::Error for CodexError {}
