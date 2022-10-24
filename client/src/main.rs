use std::sync::Arc;

use codex_types::{
    cache::Cache,
    codex::{CodexClient, CodexClientBuilder, CodexError, Completion, CompletionQuery},
    langserver::{py::PyServer, ts::TsServer, LangServer},
};
use tokio::sync::Mutex;

use clap::Parser;

/// Program that uses OpenAI Codex for Gradual Type Inference
#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
struct Args {
    /// Codex tokens to use, separated by commas
    #[clap(short, long, value_parser)]
    tokens: String,

    /// The target language.
    /// Either `ts` or `py`
    #[clap(short, long, value_parser, default_value = "ts")]
    lang: String,

    /// The target file path
    #[clap(short, long, value_parser)]
    file: String,

    /// Output file directory path
    #[clap(short, long, value_parser)]
    output: String,

    /// Completion strategy. Either: {"simple": simple completion, "tree": tree completion}
    #[clap(short, long, value_parser, default_value = "simple")]
    strategy: String,

    /// The number of completions to return
    #[clap(short, long, value_parser, default_value = "3")]
    n: usize,

    /// The number of request to send to Codex
    #[clap(short, long, value_parser, default_value = "1")]
    retries: usize,

    /// Whether to fallback to "any" or not
    #[clap(long, value_parser, default_value_t = false)]
    fallback: bool,

    /// The url of the codex endpoint
    #[clap(
        short,
        long,
        value_parser,
        default_value = "https://api.openai.com/v1/edits"
    )]
    endpoint: String,

    /// The temperature to use for the completion
    #[clap(long, value_parser, default_value_t = 1.0)]
    temp: f64,

    /// The maximum number of type-checkable completions to return
    #[clap(long, value_parser, default_value_t = 1)]
    stop_at: usize,

    /// The Redis URL for the cache
    #[clap(short, long, value_parser)]
    cache: Option<String>,
}

impl Args {
    async fn lang_client(&self) -> Arc<dyn LangServer + Send + Sync> {
        fn get_path(folder: String) -> String {
            std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .parent()
                .unwrap()
                .join(folder)
                .to_str()
                .unwrap()
                .to_string()
        }
        match self.lang.as_str() {
            "ts" => {
                let path = get_path("ts-ast".to_string());
                Arc::new(
                    TsServer::make(&path)
                        .await
                        .expect("failed to make ts server"),
                )
            }
            "py" => {
                let path = get_path("py-ast".to_string());
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
}

#[tokio::main]
async fn main() {
    let args = Args::parse();

    let lang_client = args.lang_client().await;

    let file_contents = tokio::fs::read_to_string(&args.file).await.unwrap();

    let cache: Option<Arc<Mutex<Cache>>> = args.cache.map(|u| {
        Arc::new(Mutex::new(Cache::new(&u, args.stop_at).unwrap_or_else(
            |e| {
                eprintln!("Failed to connect to redis: {}", e);
                std::process::exit(1);
            },
        )))
    });

    let tokens = args
        .tokens
        .split(',')
        .map(|s| s.to_string())
        .collect::<Vec<_>>();

    let mut codex = CodexClientBuilder::new(tokens, lang_client);
    codex.endpoint(args.endpoint).temperature(args.temp);

    if let Some(cache) = cache {
        codex.cache(cache);
    }

    let codex = codex.build();

    let ctx = MainCtx {
        file_contents,
        codex,
        num_comps: args.n,
        retries: args.retries,
        fallback: args.fallback,
        stop_at: args.stop_at,
    };

    // the typechecked and completed code(s). here if we get errors we exit with 1
    let good_ones: Vec<Completion> = match args.strategy.as_str() {
        "simple" => ctx.simple_strategy().await,
        "tree" => todo!("tree completion"),
        _ => {
            eprintln!("Unknown strategy, {}", args.strategy);
            std::process::exit(1);
        }
    };

    if good_ones.is_empty() {
        eprintln!("No completions type checked");
        std::process::exit(1);
    }

    println!("Number of type-checking completions: {}", good_ones.len());

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

struct MainCtx {
    codex: CodexClient,
    file_contents: String,
    num_comps: usize,
    retries: usize,
    fallback: bool,
    stop_at: usize,
}

impl MainCtx {
    /// Runs the simple completion strategy, which just runs the completion on the given file
    /// without any transformation, other than adding "_hole_" to each unknwon type
    async fn simple_strategy(self) -> Vec<Completion> {
        let printed = self
            .codex
            .get_ls()
            .pretty_print(&self.file_contents, "_hole_")
            .await
            .unwrap();

        println!("pretty:\n{}", printed);

        let query = CompletionQuery::new(printed, self.num_comps, self.retries, self.fallback);

        let resp = match self.codex.complete(query.clone()).await {
            Ok(r) => r,
            Err(CodexError::RateLimit(r)) if !r.is_empty() => {
                eprintln!(
                    "Rate limited, but got {} canditate completions before.",
                    r.len()
                );
                r
            }
            Err(e) => {
                eprintln!("Fatal error: {}", e);
                std::process::exit(1);
            }
        };

        let lang_client = self.codex.get_ls();
        let mut comps: Vec<Completion> = vec![];
        for (i, comp) in resp.into_iter().enumerate() {
            println!("comp {}:\n {}", i, comp.code);
            let type_checks = lang_client.type_check(&comp.code).await.unwrap();
            if type_checks {
                comps.push(comp);
            }
            if comps.len() >= self.stop_at {
                break;
            }
        }

        // cache the type-checked completions if we have a cache
        if let Some(mut cache) = self.codex.get_cache().await {
            // we want to get all the completions that are typechecked
            // except the one that fallbacked (if there is any)
            let comps_no_fallback = comps
                .iter()
                .filter(|c| !c.fallbacked)
                .map(|c| c.code.clone())
                .collect::<Vec<String>>();

            if !comps_no_fallback.is_empty() {
                cache
                    .store(&query, &comps_no_fallback)
                    .expect("failed to store in cache");
            }
        }

        comps
    }
}
