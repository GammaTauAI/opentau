use std::sync::Arc;

use opentau::{
    get_path_from_rootdir,
    cache::Cache,
    completion::{Completion, incoder::IncoderClientBuilder, ArcCompletionModel},
    completion::{codex::CodexClientBuilder, ArcCompletionEngine, CompletionClientBuilder},
    langserver::{py::PyServer, ts::TsServer, ArcLangServer, LangServer},
    main_strategies::{MainCtx, MainStrategy, SimpleStrategy, TreeStrategy},
};
use tokio::sync::Mutex;

use clap::Parser;

/// OpenTau, a program that uses Natural Language Models for Code to
/// type-infer and generate types for gradually typed languages.
#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
struct Args {
    /// The API token for an online completion engine. Not required if using a local engine.
    #[clap(short, long, value_parser)]
    tokens: Option<String>,

    /// The target language.
    /// Either {"ts", "py"}.
    #[clap(short, long, value_parser, default_value = "ts")]
    lang: String,

    /// The target file path
    #[clap(short, long, value_parser)]
    file: String,

    /// Output file directory path
    #[clap(short, long, value_parser)]
    output: String,

    /// Completion strategy. Either: {"simple": simple completion, "tree": tree completion}
    #[clap(short, long, value_parser, default_value = "tree")]
    strategy: String,

    /// The number of completions to return
    #[clap(short, long, value_parser, default_value = "3")]
    n: usize,

    /// The number of request to send to the completion engine
    #[clap(short, long, value_parser, default_value = "1")]
    retries: usize,

    /// Whether to fallback to "any" or not
    #[clap(long, value_parser, default_value_t = false)]
    fallback: bool,

    /// Which engine to use. Either: {"codex", "incoder"}
    #[clap(short, long, value_parser, default_value = "codex")]
    engine: String,

    /// The url or file path to the completion engine. If this is an online engine, it
    /// may be a url. If it is a local engine, it may be a file path to a socket.
    #[clap(long, value_parser)]
    endpoint: Option<String>,

    /// The temperature to use for the completion
    #[clap(long, value_parser, default_value_t = 1.0)]
    temp: f64,

    /// The maximum number of type-checkable completions to return
    #[clap(long, value_parser, default_value_t = 1)]
    stop_at: usize,

    /// The Redis URL for the cache
    #[clap(short, long, value_parser)]
    cache: Option<String>,

    /// Whether or not to prevent rate limits. You may want to set this to false if You
    /// are using your own model. By default, we try to prevent rate limits, by using
    /// this flag you can disable this behavior.
    #[clap(long, value_parser, default_value_t = false)]
    disable_rate_limit: bool,

    /// The maximum type-quality score for a completion to be valid (lower means better quality)
    #[clap(long, short, value_parser, default_value_t = 1000)]
    max_type_quality: u16,

    /// Disables type-checking and just outputs all candidates
    #[clap(long, value_parser, default_value_t = false)]
    disable_type_check: bool,

    /// Enables type definition generation
    #[clap(long, value_parser, default_value_t = false)]
    enable_defgen: bool,

    /// Depth limit for the tree strategy
    #[clap(long, value_parser)]
    depth_limit: Option<usize>,

    /// Disables the usage blocks in the tree strategy prompts
    #[clap(long, value_parser, default_value_t = false)]
    disable_usages: bool,
}

impl Args {
    async fn lang_client_factory(&self) -> ArcLangServer {
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

    async fn completion_engine_factory(
        &self,
        ls: ArcLangServer,
        cache: Option<Arc<Mutex<Cache>>>,
    ) -> ArcCompletionEngine {
        let model: ArcCompletionModel
            = match self.engine.as_str() {
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
            "incoder" => {
                let mut builder = IncoderClientBuilder::new();
                if let Some(endpoint) = &self.endpoint {
                    builder = builder.socket_path(endpoint.clone());
                }

                Arc::new(builder.build().await.expect("Failed to spawn incoder server"))
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

    fn stategy_factory(&self) -> Box<dyn MainStrategy> {
        match self.strategy.as_str() {
            "simple" => Box::new(SimpleStrategy {}),
            "tree" => Box::new(TreeStrategy {}),
            _ => {
                eprintln!("Unknown strategy, {}", self.strategy);
                std::process::exit(1);
            }
        }
    }
}

#[tokio::main]
async fn main() {
    let args = Args::parse();

    let lang_client = args.lang_client_factory().await;
    let strategy = args.stategy_factory();

    let file_contents = tokio::fs::read_to_string(&args.file).await.unwrap();

    let cache: Option<Arc<Mutex<Cache>>> = args.cache.as_ref().map(|u| {
        Arc::new(Mutex::new(Cache::new(u, args.stop_at).unwrap_or_else(
            |e| {
                eprintln!("Failed to connect to redis: {e}");
                std::process::exit(1);
            },
        )))
    });

    let ctx = MainCtx {
        file_contents,
        engine: args.completion_engine_factory(lang_client, cache).await,
        num_comps: args.n,
        retries: args.retries,
        fallback: args.fallback,
        stop_at: args.stop_at,
        enable_type_check: !args.disable_type_check,
        enable_defgen: args.enable_defgen,
        depth_limit: args.depth_limit,
        enable_usages: !args.disable_usages,
    };

    // the typechecked and completed code(s). here if we get errors we exit with 1
    let good_ones: Vec<Completion> = strategy.run(ctx).await;

    if good_ones.is_empty() {
        eprintln!("No completions type checked");
        std::process::exit(1);
    }

    println!("Number of good completions: {}", good_ones.len());

    // if the completed dir does not exist, create it
    let output_dir = std::path::Path::new(&args.output);
    if !output_dir.exists() {
        tokio::fs::create_dir_all(output_dir).await.unwrap();
    }

    // write to the output dir
    for (i, comp) in good_ones.into_iter().enumerate() {
        let fallback = if comp.fallbacked { "_fallback" } else { "" };
        let output_path = format!(
            "{}/{}_score_{}{}.{}",
            args.output, i, comp.score, fallback, args.lang
        );
        tokio::fs::write(&output_path, comp.code).await.unwrap();
    }
}
