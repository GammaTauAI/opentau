use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tokio::{sync::Mutex, task::JoinHandle};

use crate::completion::filter_comps;

use super::{CompletionEngine, CompletionModel, CompletionQuery, ModelResponseError, INSTRUCTIONS};

mod rl {
    use dashmap::DashMap;
    use governor::{
        clock::{QuantaClock, QuantaInstant},
        middleware::NoOpMiddleware,
        state::InMemoryState,
        Quota, RateLimiter,
    };
    use std::sync::Arc;
    use tokio::sync::Mutex;

    type RL = Arc<
        RateLimiter<
            String,
            DashMap<String, InMemoryState>,
            QuantaClock,
            NoOpMiddleware<QuantaInstant>,
        >,
    >;

    #[derive(Clone, Debug)]
    /// Rate limited pool of tokens that can be used to query codex
    pub(super) struct RateLimitedTokenPool {
        tokens: Arc<Vec<String>>,
        token_idx: Arc<Mutex<usize>>,
        rl: Option<RL>, // we may not have a rate limiting policy
    }

    impl RateLimitedTokenPool {
        async fn next_token(&self) -> String {
            let mut token_idx = self.token_idx.lock().await;
            let token = self.tokens[*token_idx].clone();
            *token_idx = (*token_idx + 1) % self.tokens.len();
            token
        }

        /// Waits for a token to become available, then returns it.
        pub async fn wait_token(&self) -> String {
            let token = self.next_token().await;
            match &self.rl {
                Some(rl) => {
                    rl.until_key_ready(&token).await;
                }
                None => (),
            }
            token
        }

        /// Creates a new limiter pool given the list of tokens.
        /// If rl is false, then no rate limiting is applied.
        ///
        /// # Panics
        /// Panics if the list of tokens is empty.
        pub fn new(tokens: Vec<String>, rl: bool) -> Self {
            assert!(!tokens.is_empty());
            let reset = 120 / 10; // 2 minutes / 10 cells = 12 seconds
            let rate_limiter = Arc::new(RateLimiter::keyed(
                Quota::with_period(std::time::Duration::from_secs(reset)) // we want to reset every 2 minutes
                    .unwrap()
                    .allow_burst(std::num::NonZeroU32::new(4).unwrap()), // max 4 requests per 12 seconds
            ));

            rate_limiter.check_key(&tokens[0]).unwrap();

            Self {
                rl: if rl { Some(rate_limiter) } else { None },
                tokens: Arc::new(tokens),
                token_idx: Arc::new(Mutex::new(0)),
            }
        }
    }
}

/// Represents a client to the codex API. Safe to clone as most of the fields are
/// wrapped in an Arc.
#[derive(Clone)]
pub struct CodexClient {
    // the reqwest client used to send requests to codex
    pub client: reqwest::Client,
    // The rate limited token pool, that produces the token used for this client
    rate_limiter: rl::RateLimitedTokenPool,
}

#[derive(Clone)]
pub struct CodexClientBuilder {
    client: Option<reqwest::Client>,
    tokens: Vec<String>,
    rate_limit: bool,
}

impl CodexClientBuilder {
    pub fn new(tokens: Vec<String>) -> Self {
        Self {
            client: None,
            tokens,
            rate_limit: true,
        }
    }

    pub fn client(mut self, client: reqwest::Client) -> Self {
        self.client = Some(client);
        self
    }

    pub fn rate_limit(mut self, rate_limit: bool) -> Self {
        self.rate_limit = rate_limit;
        self
    }

    /// Builds the client and consumes the builder
    pub fn build(self) -> CodexClient {
        let client = self.client.unwrap_or_else(reqwest::Client::new);
        let rate_limiter = rl::RateLimitedTokenPool::new(self.tokens, self.rate_limit);
        CodexClient {
            client,
            rate_limiter,
        }
    }
}

impl CompletionModel for CodexClient {
    /// Spawns a task that sends the completion requests to codex
    fn spawn_comp(
        &self,
        query: &CompletionQuery,
        engine: &dyn CompletionEngine,
        filtered_completions: Arc<Mutex<Vec<(String, u16)>>>,
    ) -> JoinHandle<Result<(), ModelResponseError>> {
        // clones for the closure

        // from self:
        let lang_client = engine.get_ls();
        let client = self.client.clone(); // NOTE: reqwest uses Arc internally
        let endpoint = engine
            .get_endpoint()
            .unwrap_or_else(|| "https://api.openai.com/v1/edits".to_string());
        let temp = engine.get_temperature();
        let rl = self.rate_limiter.clone();
        let max_type_score = engine.get_max_type_score();

        // from query:
        let num_comps = query.num_comps;
        let input = query.input.to_string();
        let problem_whitelist = query.problem_whitelist.clone();
        let instructions = query
            .instructions
            .as_ref()
            .map(|s| s.to_string())
            .unwrap_or_else(|| INSTRUCTIONS.to_string());

        tokio::spawn(async move {
            let token = rl.wait_token().await;
            let req = client
                .post(&endpoint)
                .bearer_auth(token)
                .header("Content-Type", "application/json")
                .body(serde_json::to_string(&EditReq {
                    model: "code-davinci-edit-001".to_string(),
                    input: input.to_string(),
                    n: num_comps,
                    temperature: temp,
                    instruction: instructions,
                })?)
                .timeout(std::time::Duration::from_secs(std::cmp::max(
                    30, // make timeout scale up with number of completions
                    (num_comps * 10) as u64,
                )));
            let res = req.send().await?;
            let body = res.text().await?;
            let choices: Vec<EditRespChoice> = match serde_json::from_str::<EditResp>(&body) {
                Ok(EditResp::Choices { choices }) => choices,
                Ok(EditResp::Error { error }) => return Err(error.into()),
                Err(e) => {
                    eprintln!("Error parsing response from codex: {e}");
                    eprintln!("Response: {body}");
                    return Err(ModelResponseError::CouldNotComplete);
                }
            };

            println!("Got {} responses from codex", choices.len());

            for comp in choices.into_iter() {
                let text = match comp {
                    EditRespChoice::Text { text } => text,
                    EditRespChoice::Error { error: e } => {
                        println!("Got error from codex: {e}");
                        continue;
                    }
                };

                filter_comps(
                    filtered_completions.clone(),
                    lang_client.clone(),
                    &input,
                    text,
                    problem_whitelist.clone(),
                    max_type_score,
                )
                .await?;
            }

            Ok(())
        })
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct EditReq {
    pub model: String,
    pub input: String,
    pub instruction: String,
    pub n: usize,
    pub temperature: f64,
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

impl From<EditRespError> for ModelResponseError {
    fn from(e: EditRespError) -> Self {
        match e {
            EditRespError::InvalidEdit { message } => ModelResponseError::InvalidResponse(message),
            EditRespError::RateLimited { message } => ModelResponseError::RateLimited(message),
        }
    }
}

impl std::fmt::Display for EditRespError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EditRespError::InvalidEdit { message } => write!(f, "Invalid edit: {message}"),
            EditRespError::RateLimited { message } => write!(f, "Rate limited: {message}"),
        }
    }
}
