use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tokio::{sync::Mutex, task::JoinHandle};

use crate::{
    cache::Cache,
    langserver::{ArcLangServer, LangServer, LangServerError},
};

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
        rl: RL,
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
            self.rl.until_key_ready(&token).await;
            token
        }

        /// Creates a new limiter pool given the list of tokens.
        ///
        /// # Panics
        /// Panics if the list of tokens is empty.
        pub fn new(tokens: Vec<String>) -> Self {
            assert!(!tokens.is_empty());
            let reset = 120 / 10; // 2 minutes / 10 cells = 12 seconds
            let rate_limiter = Arc::new(RateLimiter::keyed(
                Quota::with_period(std::time::Duration::from_secs(reset)) // we want to reset every 2 minutes
                    .unwrap()
                    .allow_burst(std::num::NonZeroU32::new(4).unwrap()), // max 4 requests per 12 seconds
            ));

            rate_limiter.check_key(&tokens[0]).unwrap();

            Self {
                rl: rate_limiter,
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
    pub client: reqwest::Client,
    // the language server
    lang_server: ArcLangServer,
    // the codex URL endpoint
    pub endpoint: String,
    // the temperature to use for the completion
    pub temperature: f64,
    // The cache to use for the completions
    cache: Option<Arc<Mutex<Cache>>>,
    // The rate limited token pool, that produces the token used for this client
    rate_limiter: rl::RateLimitedTokenPool,
}

#[derive(Clone)]
pub struct CodexClientBuilder {
    pub client: Option<reqwest::Client>,
    pub tokens: Vec<String>,
    pub lang_server: ArcLangServer,
    pub endpoint: Option<String>,
    pub temperature: Option<f64>,
    pub cache: Option<Arc<Mutex<Cache>>>,
}

impl CodexClientBuilder {
    pub fn new(tokens: Vec<String>, lang_server: ArcLangServer) -> Self {
        Self {
            client: None,
            tokens,
            lang_server,
            endpoint: None,
            temperature: None,
            cache: None,
        }
    }

    pub fn client(&mut self, client: reqwest::Client) -> &mut Self {
        self.client = Some(client);
        self
    }

    pub fn endpoint(&mut self, endpoint: String) -> &mut Self {
        self.endpoint = Some(endpoint);
        self
    }

    pub fn temperature(&mut self, temperature: f64) -> &mut Self {
        self.temperature = Some(temperature);
        self
    }

    pub fn cache(&mut self, cache: Arc<Mutex<Cache>>) -> &mut Self {
        self.cache = Some(cache);
        self
    }

    /// Builds the client and consumes the builder
    pub fn build(&mut self) -> CodexClient {
        let client = self.client.take().unwrap_or_else(reqwest::Client::new);
        let endpoint = self
            .endpoint
            .take()
            .unwrap_or_else(|| "https://api.openai.com/v1/edits".to_string());
        let temperature = self.temperature.take().unwrap_or(1.0);
        let cache = self.cache.take();
        let rate_limiter = rl::RateLimitedTokenPool::new(self.tokens.drain(..).collect());
        CodexClient {
            client,
            lang_server: self.lang_server.clone(),
            endpoint,
            temperature,
            cache,
            rate_limiter,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompletionQuery {
    pub input: String,
    pub num_comps: usize,
    pub retries: usize,
    pub fallback: bool,
}

impl CompletionQuery {
    pub fn new(input: String, num_comps: usize, retries: usize, fallback: bool) -> Self {
        Self {
            input,
            num_comps,
            retries,
            fallback,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Completion {
    pub code: String,
    pub score: i64,
    pub fallbacked: bool, // is this completion from fallback?
}

const INSTRUCTIONS: &str = "Substitute the identifier _hole_ with the correct type.";

impl CodexClient {
    /// Completes the given input code using the codex API. The given input code has to be pretty
    /// printed such that unknown types are represented by "_hole_".
    /// num_comps is the number of completions to return per request.
    /// retries is the number of requests to make to codex, which creates duplicates, so we filter
    /// them out.
    /// fallback is whether to fallback to "any" if we don't get any completions.
    pub async fn complete(
        &self,
        mut query: CompletionQuery,
    ) -> Result<Vec<Completion>, CodexError> {
        // we filter incomplete completions
        // scored vec: implemented scoring, sort resulting vec by score,
        //             and fall back to all "any" in worst case (if enabled)
        let filtered_completions: Arc<Mutex<Vec<(String, i64)>>> = Arc::new(Mutex::new(Vec::new()));
        let mut handles: Vec<JoinHandle<Result<(), CodexError>>> = Vec::new();

        // check cache first, if the cache is set
        // NOTE: we need to query a list of comps with the same (input, num_comps, retries) tuple

        if let Some(cache) = &self.cache {
            let mut cache = cache.lock().await;
            let cached_completions = cache.retrieve(&query).unwrap();
            if let Some(cached_completions) = cached_completions {
                filtered_completions
                    .lock()
                    .await
                    .extend(cached_completions.into_iter().map(|c| (c, 0)));
                query.retries = 0; // so we don't make any requests to codex
            }
        }

        while query.retries > 0 {
            handles.push(self.spawn_comp_req(&query, filtered_completions.clone()));
            query.retries -= 1;
        }

        let mut rate_limit = false;

        for handle in handles {
            let res = handle.await.unwrap();
            if let Err(e) = res {
                if let CodexError::ErrorResponse(EditRespError::RateLimited { message: msg }) = &e {
                    println!("Rate limited by codex. {}", msg);
                    rate_limit = true;
                } else {
                    println!("Error in completion thread: {:?}", e);
                }
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
            .map(|(c, i)| Completion {
                code: c.to_string(),
                score: *i,
                fallbacked: false,
            })
            .collect::<Vec<Completion>>();

        if query.fallback {
            final_completions.push(Completion {
                code: self.lang_server.pretty_print(&query.input, "any").await?,
                score: 999999999,
                fallbacked: true,
            });
        }

        if rate_limit {
            // if we rate limit, we still want to return the completions we have (may not have any)
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

    /// Spawns a task that sends the completion requests to codex
    fn spawn_comp_req(
        &self,
        query: &CompletionQuery,
        filtered_completions: Arc<Mutex<Vec<(String, i64)>>>,
    ) -> JoinHandle<Result<(), CodexError>> {
        let lang_client = self.lang_server.clone();
        let input = query.input.to_string();
        let client = self.client.clone(); // NOTE: reqwest uses Arc internally
        let endpoint = self.endpoint.clone();
        let temp = self.temperature;
        let num_comps = query.num_comps;
        let rl = self.rate_limiter.clone();

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
                    instruction: INSTRUCTIONS.to_string(),
                })?)
                .timeout(std::time::Duration::from_secs(std::cmp::max(
                    30, // make timeout scale up with number of completions
                    (num_comps * 10) as u64,
                )));
            let res = req.send().await?;
            let body = res.text().await?;
            let choices: Vec<EditRespChoice> = match serde_json::from_str::<EditResp>(&body)? {
                EditResp::Choices { choices } => choices,
                EditResp::Error { error } => return Err(CodexError::ErrorResponse(error)),
            };

            println!("Got {} responses from codex", choices.len());

            for comp in choices.into_iter() {
                let text = match comp {
                    EditRespChoice::Text { text } => text,
                    EditRespChoice::Error { error: e } => {
                        println!("Got error from codex: {}", e);
                        continue;
                    }
                };

                // check first if it's duplicate in our filtered completions
                if filtered_completions
                    .lock()
                    .await
                    .iter()
                    .any(|(c, _)| c == &text)
                {
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
                    filtered_completions.lock().await.push((text, score));
                }
            }

            Ok(())
        })
    }

    /// Gets the language server object from the codex client
    pub fn get_ls(&self) -> Arc<dyn LangServer + Send + Sync> {
        self.lang_server.clone()
    }

    /// Gets a mutex guard to the cache from the codex client, if a cache is being used
    pub async fn get_cache(&self) -> Option<tokio::sync::MutexGuard<Cache>> {
        if let Some(cache) = &self.cache {
            Some(cache.lock().await)
        } else {
            None
        }
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
    RateLimit(Vec<Completion>),
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
