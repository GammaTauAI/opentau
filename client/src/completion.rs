use std::sync::Arc;

use serde::{Deserialize, Serialize};

use crate::{
    cache::Cache,
    langserver::{LangServer, LangServerError},
};

use self::codex::EditRespError;

pub mod codex;

/// This is the trait that defines operations on the completion engine (Codex, incoder, santacoder,
/// etc..). The completion engine is coupled with the language server.
#[async_trait::async_trait]
pub trait CompletionEngine {
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
    fn get_ls(&self) -> Arc<dyn LangServer + Send + Sync>;

    /// Gets a mutex guard to the cache from the codex client.
    /// If the given completion engine does not use a cache, this will return None.
    async fn get_cache(&self) -> Option<tokio::sync::MutexGuard<Cache>>;
}

pub type ArcCompletionEngine = Arc<dyn CompletionEngine + Send + Sync>;

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

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Completion {
    pub code: String,
    pub score: i64,
    pub fallbacked: bool, // is this completion from fallback?
}

// TODO: generalize this to all completion engines
// to do that, we need to decouple these variants:
// - ErrorResponse: We need to make this more generic
// - CodexCouldNotComplete: This is specific to codex, split it out
// - RateLimit: This is specific to codex and other completion engines that use rate limiting
// - Reqwest: This is specific to engines that use http requests. probably keep this?
#[derive(Debug)]
pub enum CompletionError {
    ErrorResponse(EditRespError),
    CodexCouldNotComplete,
    // where the Vec<String> is the list of completions we got before the rate limit
    RateLimit(Vec<Completion>),
    LangServer(LangServerError),
    Reqwest(reqwest::Error),
    Serde(serde_json::Error),
}

impl From<LangServerError> for CompletionError {
    fn from(e: LangServerError) -> Self {
        CompletionError::LangServer(e)
    }
}

impl From<reqwest::Error> for CompletionError {
    fn from(e: reqwest::Error) -> Self {
        CompletionError::Reqwest(e)
    }
}

impl From<serde_json::Error> for CompletionError {
    fn from(e: serde_json::Error) -> Self {
        CompletionError::Serde(e)
    }
}

impl std::fmt::Display for CompletionError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CompletionError::LangServer(e) => write!(f, "Language client error: {e}"),
            CompletionError::Reqwest(e) => write!(f, "Reqwest error: {e}"),
            CompletionError::Serde(e) => write!(f, "Serde error: {e}"),
            CompletionError::ErrorResponse(s) => write!(f, "Codex error response: {s}"),
            CompletionError::CodexCouldNotComplete => write!(f, "Codex could not complete"),
            CompletionError::RateLimit(completions) => {
                write!(f, "Codex rate limit. Got {} completions", completions.len())
            }
        }
    }
}

impl std::error::Error for CompletionError {}
