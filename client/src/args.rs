use std::sync::Arc;

use crate::{
    cache::Cache,
    completion::{codex::CodexClientBuilder, ArcCompletionEngine, CompletionClientBuilder},
    completion::{local::LocalModelClientBuilder, ArcCompletionModel},
    get_path_from_rootdir,
    langserver::{py::PyServer, ts::TsServer, ArcLangServer, LangServer},
    main_strategies::{MainStrategy, SimpleStrategy, TreeStrategy},
};
use tokio::sync::Mutex;

use clap::Parser;

/// OpenTau, a program that uses Natural Language Models for Code to
/// type-infer and generate types for gradually typed languages.
#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
pub struct Args {
    /// The API token for an online completion engine. Not required if using a local engine.
    #[clap(short, long, value_parser)]
    pub tokens: Option<String>,

    /// The target language.
    /// Either {"ts", "py"}.
    #[clap(short, long, value_parser, default_value = "ts")]
    pub lang: String,

    /// The target file path
    #[clap(short, long, value_parser)]
    pub file: String,

    /// Output file directory path
    #[clap(short, long, value_parser)]
    pub output: String,

    /// Completion strategy. Either: {"simple": simple completion, "tree": tree completion}
    #[clap(short, long, value_parser, default_value = "tree")]
    pub strategy: String,

    /// The number of completions to return
    #[clap(short, long, value_parser, default_value = "3")]
    pub n: usize,

    /// The number of request to send to the completion engine
    #[clap(short, long, value_parser, default_value = "1")]
    pub retries: usize,

    /// Whether to fallback to "any" or not
    #[clap(long, value_parser, default_value_t = false)]
    pub fallback: bool,

    /// Which engine to use. Either: {"codex", "incoder", "santacoder"}
    #[clap(short, long, value_parser, default_value = "codex")]
    pub engine: String,

    /// The url or file path to the completion engine. If this is an online engine, it
    /// may be a url. If it is a local engine, it may be a file path to a socket.
    /// Some local models allow for multi-gpu via comma-separated socket paths.
    #[clap(long, value_parser)]
    pub endpoint: Option<String>,

    /// The temperature to use for the completion
    #[clap(long, value_parser, default_value_t = 1.0)]
    pub temp: f64,

    /// The maximum number of type-checkable completions to return
    #[clap(long, value_parser, default_value_t = 1)]
    pub stop_at: usize,

    /// The Redis URL for the cache
    #[clap(short, long, value_parser)]
    pub cache: Option<String>,

    /// Whether or not to prevent rate limits. You may want to set this to false if You
    /// are using your own model. By default, we try to prevent rate limits, by using
    /// this flag you can disable this behavior.
    #[clap(long, value_parser, default_value_t = false)]
    pub disable_rate_limit: bool,

    /// The maximum type-quality score for a completion to be valid (lower means better quality)
    #[clap(long, short, value_parser, default_value_t = 1000)]
    pub max_type_quality: u16,

    /// Disables type-checking and just outputs all candidates
    #[clap(long, value_parser, default_value_t = false)]
    pub disable_type_check: bool,

    /// Enables type definition generation
    #[clap(long, value_parser, default_value_t = false)]
    pub enable_defgen: bool,

    /// Depth limit for the tree strategy
    #[clap(long, value_parser)]
    pub depth_limit: Option<usize>,

    /// Disables the usage blocks in the tree strategy prompts
    #[clap(long, value_parser, default_value_t = false)]
    pub disable_usages: bool,

    /// Disables stubbing inner code blocks in the tree strategy prompts
    #[clap(long, value_parser, default_value_t = false)]
    pub disable_stubbing: bool,

    /// List of statements to exclude from being annotated (comma-separated).
    /// You can exclude the following types: {"VarDecl", "FuncDecl", "FuncExpr", "ClassProp", "ClassMethod", "TypeDecl"}
    #[clap(long, value_parser)]
    pub exclude: Option<String>,
}

impl Args {
    pub async fn lang_client_factory(&self) -> ArcLangServer {
        match self.lang.as_str() {
            "ts" => {
                let path = get_path_from_rootdir("ts-compiler".to_string());
                Arc::new(
                    TsServer::make(&path)
                        .await
                        .expect("failed to make ts server"),
                )
            }
            "py" => {
                let path = get_path_from_rootdir("py-ast".to_string());
                Arc::new(
                    PyServer::make(&path)
                        .await
                        .expect("failed to make py server"),
                )
            }
            _ => {
                eprintln!("Unknown language, {}", self.lang);
                std::process::exit(1);
            }
        }
    }

    pub async fn completion_engine_factory(
        &self,
        ls: ArcLangServer,
        cache: Option<Arc<Mutex<Cache>>>,
    ) -> ArcCompletionEngine {
        let model: ArcCompletionModel = match self.engine.as_str() {
            "codex" => {
                if self.tokens.is_none() {}
                let tokens = self
                    .tokens
                    .as_ref()
                    .unwrap_or_else(|| {
                        eprintln!("Codex tokens are required");
                        std::process::exit(1);
                    })
                    .split(',')
                    .map(|s| s.to_string())
                    .collect::<Vec<_>>();

                Arc::new(
                    CodexClientBuilder::new(tokens)
                        .rate_limit(!self.disable_rate_limit)
                        .build(),
                )
            }
            "incoder" | "santacoder" => {
                let mut builder = LocalModelClientBuilder::new(self.engine.clone());
                if let Some(endpoint) = &self.endpoint {
                    builder = builder.socket_path(endpoint.clone());
                }

                Arc::new(
                    builder
                        .build()
                        .await
                        .unwrap_or_else(|_| panic!("failed to make {} client", self.engine)),
                )
            }
            _ => {
                eprintln!("Unknown engine, {}", self.engine);
                std::process::exit(1);
            }
        };
        let mut engine = CompletionClientBuilder::new(ls, model)
            .temperature(self.temp)
            .max_type_score(self.max_type_quality);
        if let Some(cache) = cache {
            engine = engine.cache(cache);
        }
        if let Some(endpoint) = &self.endpoint {
            engine = engine.endpoint(endpoint.to_string());
        }
        Arc::new(engine.build())
    }

    pub fn stategy_factory(&self) -> Box<dyn MainStrategy> {
        match self.strategy.as_str() {
            "simple" => Box::new(SimpleStrategy {}),
            "tree" => Box::new(TreeStrategy { stats: None }),
            _ => {
                eprintln!("Unknown strategy, {}", self.strategy);
                std::process::exit(1);
            }
        }
    }
}
