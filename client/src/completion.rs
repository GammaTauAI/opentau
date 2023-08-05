use std::sync::Arc;

use serde::{Deserialize, Serialize};
use thiserror::Error;
use tokio::{sync::Mutex, task::JoinHandle};

use crate::{
    cache::Cache,
    debug,
    langserver::{ArcLangServer, CheckProblem, LangServer, LangServerError},
    socket::SocketError,
};

pub mod codex;
pub mod local;
pub mod builtin;

/// This is the trait that defines operations on the completion engine (Codex, incoder, santacoder,
/// etc..). The completion engine is coupled with the language server.
#[async_trait::async_trait]
pub trait CompletionEngine: std::fmt::Debug {
    /// Completes the given query using the completion engine.
    /// Query structure:
    /// - num_comps is the number of completions to return per request.
    /// - retries is the number of requests to make to codex, which creates duplicates, we filter
    ///   these out.
    /// - fallback is whether to fallback to "any" if we don't get any completions.
    async fn complete(
        &self,
        mut query: CompletionQuery,
    ) -> Result<Vec<Completion>, CompletionError>;

    /// Gets the language server object from the completion engine object.
    fn get_ls(&self) -> ArcLangServer;

    /// Gets an endpoint url for the model, if there is one.
    fn get_endpoint(&self) -> Option<String>;

    /// Gets the temperature used for querying the model.
    fn get_temperature(&self) -> f64;

    /// Gets the maximum type score allowed for a completion.
    fn get_max_type_score(&self) -> u16;

    /// Gets a mutex guard to the cache from the codex client.
    /// If the given completion engine does not use a cache, this will return None.
    async fn get_cache(&self) -> Option<tokio::sync::MutexGuard<Cache>>;
}

pub type ArcCompletionEngine = Arc<dyn CompletionEngine + Send + Sync>;

/// This is a trait that defines operations for a model that can be used to complete code.
pub trait CompletionModel: std::fmt::Debug {
    /// Spawns a completion thread, and populates the filtered_completion vector with
    /// the completions of the query.
    fn spawn_comp(
        &self,
        query: &CompletionQuery,
        engine: &dyn CompletionEngine,
        filtered_completions: Arc<Mutex<Vec<(String, u16)>>>,
    ) -> JoinHandle<Result<(), ModelResponseError>>;
}

pub type ArcCompletionModel = Arc<dyn CompletionModel + Send + Sync>;

#[derive(Debug, Clone)]
pub struct CompletionQuery {
    /// The prompt to complete
    pub input: String,
    /// The numbers of completions to return, per request
    pub num_comps: usize,
    /// The number of requests to make to the engine, which may create duplicates, we filter these out.
    pub retries: usize,
    /// Whether to include a completion that has `any` as the type of all holes.
    pub fallback: bool,
    /// The instructions for codex on how to edit the code. This is used if the model utilizes
    /// some kind of instruction based editing.
    pub instructions: Option<String>,
    /// Whitelist of CheckProblems that are allowed to happen in the completion.
    pub problem_whitelist: Vec<CheckProblem>,
    /// Whether to enable the type parser or not.
    pub enable_type_parser: bool,
}

#[derive(Debug, Clone)]
pub struct CompletionQueryBuilder {
    input: String,
    /// defaults to 3
    num_comps: Option<usize>,
    /// defaults to 1
    retries: Option<usize>,
    /// defaults to false
    fallback: Option<bool>,
    /// defaults to ""
    instructions: Option<String>,
    /// defaults to vec![]
    problem_whitelist: Option<Vec<CheckProblem>>,
    /// defaults to true
    enable_type_parser: bool,
}

impl CompletionQueryBuilder {
    pub fn new(input: String) -> Self {
        Self {
            input,
            num_comps: None,
            retries: None,
            fallback: None,
            instructions: None,
            problem_whitelist: None,
            enable_type_parser: true,
        }
    }

    pub fn num_comps(mut self, num_comps: usize) -> Self {
        self.num_comps = Some(num_comps);
        self
    }

    pub fn retries(mut self, retries: usize) -> Self {
        self.retries = Some(retries);
        self
    }

    pub fn fallback(mut self, fallback: bool) -> Self {
        self.fallback = Some(fallback);
        self
    }

    pub fn instructions<S: Into<String>>(mut self, instructions: S) -> Self {
        self.instructions = Some(instructions.into());
        self
    }

    pub fn problem_whitelist(mut self, problem_whitelist: Vec<CheckProblem>) -> Self {
        self.problem_whitelist = Some(problem_whitelist);
        self
    }

    pub fn enable_type_parser(mut self, enable_type_parser: bool) -> Self {
        self.enable_type_parser = enable_type_parser;
        self
    }

    pub fn build(self) -> CompletionQuery {
        CompletionQuery {
            input: self.input,
            num_comps: self.num_comps.unwrap_or(3),
            retries: self.retries.unwrap_or(1),
            instructions: self.instructions,
            fallback: self.fallback.unwrap_or(false),
            enable_type_parser: self.enable_type_parser,
            problem_whitelist: self.problem_whitelist.unwrap_or(vec![]),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Completion {
    /// the completed code
    pub code: String,
    /// heuristic score of the completion, [0, 1000], lower is better
    pub score: u16,
    /// is this completion from fallback?
    pub fallbacked: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct TypecheckedCompletion {
    /// the completed code
    pub code: String,
    /// heuristic score of the completion, [0, 1000], lower is better
    pub score: u16,
    /// is this completion from fallback?
    pub fallbacked: bool,
    /// the number of type errors in the completion. if 0, no type errors.
    pub num_type_errors: usize,
}

impl TypecheckedCompletion {
    pub fn new(completion: Completion, num_type_errors: usize) -> Self {
        Self {
            code: completion.code,
            score: completion.score,
            fallbacked: completion.fallbacked,
            num_type_errors,
        }
    }
}

impl From<TypecheckedCompletion> for Completion {
    fn from(tc: TypecheckedCompletion) -> Self {
        Self {
            code: tc.code,
            score: tc.score,
            fallbacked: tc.fallbacked,
        }
    }
}

/// sort based on number of type errors (increasing). if the number of type errors is the same,
/// sort based on score (lower score is better, so increasing)
pub fn sort_completions(comps: &mut [TypecheckedCompletion]) {
    comps.sort_by(|a, b| {
        if a.num_type_errors == b.num_type_errors {
            a.score.cmp(&b.score)
        } else {
            a.num_type_errors.cmp(&b.num_type_errors)
        }
    });
}

#[derive(Debug, Error)]
pub enum CompletionError {
    // where the Vec<String> is the list of completions we got before the rate limit
    #[error("Rate limit. Got {} completions", .0.len())]
    RateLimit(Vec<Completion>),
    #[error("Language server error: {0}")]
    LangServer(#[from] LangServerError),
    #[error("Socket error: {0}")]
    Socket(#[from] SocketError),
    #[error("Completion engine could not complete")]
    CouldNotComplete,
}

#[derive(Debug, Error)]
pub enum ModelResponseError {
    #[error("Reqwest error: {0}")]
    Reqwest(#[from] reqwest::Error),
    #[error("Serde error: {0}")]
    Serde(#[from] serde_json::Error),
    #[error("Invalid response: {0}")]
    InvalidResponse(String),
    #[error("Model could not complete")]
    CouldNotComplete,
    #[error("Model rate limited. Response: {0}")]
    RateLimited(String),
    #[error("Socket error: {0}")]
    Socket(#[from] SocketError),
}

/// Filters out completions that don't follow certain rules.
async fn filter_comps(
    filtered_completions: Arc<Mutex<Vec<(String, u16)>>>,
    lang_client: ArcLangServer,
    input_text: &str,
    comp_text: String,
    problem_whitelist: Vec<CheckProblem>,
    max_type_score: u16,
) -> Result<(), ModelResponseError> {
    // check first if it's duplicate in our filtered completions
    if !filtered_completions
        .lock()
        .await
        .iter()
        .any(|(c, _)| c == &comp_text)
    {
        let (problems, score) = lang_client
            .check_complete(input_text, &comp_text)
            .await
            .map_err(|e| {
                println!("Error checking completion: {e}");
                ModelResponseError::CouldNotComplete
            })?;

        // we don't want completions with higher type score than the max
        if problems.iter().all(|p| problem_whitelist.contains(p)) && score <= max_type_score {
            filtered_completions.lock().await.push((comp_text, score));
        } else {
            debug!("Filtered out completion (Problems: {problems:?}):\n{comp_text}");
        }
    }
    Ok(())
}

/// Represents a client to the completion API.
#[derive(Clone, Debug)]
pub struct CompletionClient {
    // the language server
    lang_server: ArcLangServer,
    // the codex URL endpoint
    pub endpoint: Option<String>,
    // the temperature to use for the completion
    pub temperature: f64,
    // the maxmimum type score
    pub max_type_score: u16,
    // The cache to use for the completions
    cache: Option<Arc<Mutex<Cache>>>,
    // The model that we are using
    pub model: ArcCompletionModel,
}

const HOLE_IDENTIFIER: &str = "_hole_";
const INSTRUCTIONS: &str = "Substitute the identifier _hole_ with the correct type.";

#[async_trait::async_trait]
impl CompletionEngine for CompletionClient {
    /// Completes the given input code using the model API. The given input code has to be pretty
    /// printed such that unknown types are represented by "_hole_".
    /// num_comps is the number of completions to return per request.
    /// retries is the number of requests to make to codex, which creates duplicates, so we filter
    /// them out.
    /// fallback is whether to fallback to "any" if we don't get any completions.
    async fn complete(
        &self,
        mut query: CompletionQuery,
    ) -> Result<Vec<Completion>, CompletionError> {
        // we filter incomplete completions
        // scored vec: implemented scoring, sort resulting vec by score,
        //             and fall back to all "any" in worst case (if enabled)
        let filtered_completions: Arc<Mutex<Vec<(String, u16)>>> = Arc::new(Mutex::new(Vec::new()));
        let mut handles: Vec<JoinHandle<Result<(), ModelResponseError>>> = Vec::new();

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
            handles.push(
                self.model
                    .spawn_comp(&query, self, filtered_completions.clone()),
            );
            query.retries -= 1;
        }

        let mut rate_limit = false;

        for handle in handles {
            let res = handle.await.unwrap();
            if let Err(e) = res {
                match e {
                    ModelResponseError::RateLimited(_) => {
                        println!("{e}");
                        rate_limit = true;
                    }
                    ModelResponseError::Socket(e) if matches!(e, SocketError::Io(_)) => {
                        // socket IO errors are usually irrecoverable, return error
                        println!("Socket IO error in completion thread: {e:?}");
                        return Err(CompletionError::Socket(e));
                    }
                    _ => {
                        println!("Error in completion thread: {e:?}");
                    }
                };
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
            // NOTE: we add the fallback despite the type score limit
            final_completions.push(Completion {
                code: query
                    .input
                    .replace(HOLE_IDENTIFIER, &self.lang_server.any_type()),
                score: 1000,
                fallbacked: true,
            });
        }

        if rate_limit {
            // if we rate limit, we still want to return the completions we have (may not have any)
            return Err(CompletionError::RateLimit(final_completions));
        }

        // if we have no completions, we return an error
        if final_completions.is_empty() {
            return Err(CompletionError::CouldNotComplete);
        }

        // print out scores
        print!("Score(s): ");
        let lock = filtered_completions.lock().await;
        for (i, (_, score)) in lock.iter().enumerate() {
            print!("{score}");
            if i != lock.len() - 1 {
                print!(", ");
            }
        }
        println!();

        Ok(final_completions)
    }

    /// Gets the language server object from the codex client
    fn get_ls(&self) -> ArcLangServer {
        self.lang_server.clone()
    }

    /// Gets an endpoint url for the model, if there is one.
    fn get_endpoint(&self) -> Option<String> {
        self.endpoint.clone()
    }

    /// Gets the temperature used for querying the model.
    fn get_temperature(&self) -> f64 {
        self.temperature
    }

    /// Gets the maximum type score allowed for a completion.
    fn get_max_type_score(&self) -> u16 {
        self.max_type_score
    }

    /// Gets a mutex guard to the cache from the codex client, if a cache is being used
    async fn get_cache(&self) -> Option<tokio::sync::MutexGuard<Cache>> {
        if let Some(cache) = &self.cache {
            Some(cache.lock().await)
        } else {
            None
        }
    }
}

pub struct CompletionClientBuilder {
    lang_server: ArcLangServer,
    endpoint: Option<String>,
    temperature: Option<f64>,
    max_type_score: Option<u16>,
    cache: Option<Arc<Mutex<Cache>>>,
    model: ArcCompletionModel,
}

impl CompletionClientBuilder {
    pub fn new(lang_server: ArcLangServer, model: ArcCompletionModel) -> Self {
        Self {
            lang_server,
            endpoint: None,
            temperature: None,
            max_type_score: None,
            cache: None,
            model,
        }
    }

    pub fn endpoint(mut self, endpoint: String) -> Self {
        self.endpoint = Some(endpoint);
        self
    }

    pub fn temperature(mut self, temperature: f64) -> Self {
        self.temperature = Some(temperature);
        self
    }

    pub fn cache(mut self, cache: Arc<Mutex<Cache>>) -> Self {
        self.cache = Some(cache);
        self
    }

    pub fn max_type_score(mut self, max_type_score: u16) -> Self {
        self.max_type_score = Some(max_type_score);
        self
    }

    pub fn build(self) -> CompletionClient {
        CompletionClient {
            lang_server: self.lang_server,
            endpoint: self.endpoint,
            temperature: self.temperature.unwrap_or(1.0),
            max_type_score: self.max_type_score.unwrap_or(1000),
            cache: self.cache,
            model: self.model,
        }
    }
}
