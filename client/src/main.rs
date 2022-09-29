use std::{io::Write, sync::Arc};

use codex_types::{
    cache::Cache,
    codex::{CodexError, CompletionQuery, EditReq, EditResp, EditRespError},
    langserver::{py::PyServer, ts::TsServer, LangServer},
};
use tokio::sync::Mutex;

use clap::Parser;

/// Program that uses OpenAI Codex for Gradual Type Inference
#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
struct Args {
    /// Codex token to use
    #[clap(short, long, value_parser)]
    token: String,

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

    /// The number of retries to make to codex
    #[clap(short, long, value_parser, default_value = "1")]
    retries: usize,

    /// Whether to fallback to any or not
    #[clap(short, long, value_parser, default_value_t = false)]
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
    async fn lang_client(&self) -> Arc<Mutex<dyn LangServer + Send + Sync>> {
        match self.lang.as_str() {
            "ts" => {
                let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                    .parent()
                    .unwrap()
                    .join("ts-ast")
                    .to_str()
                    .unwrap()
                    .to_string();
                Arc::new(Mutex::new(
                    TsServer::make(&path)
                        .await
                        .expect("failed to make ts server"),
                ))
            }
            "py" => {
                let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                    .parent()
                    .unwrap()
                    .join("py-ast")
                    .to_str()
                    .unwrap()
                    .to_string();
                Arc::new(Mutex::new(
                    PyServer::make(&path)
                        .await
                        .expect("failed to make py server"),
                ))
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

    let codex = codex_types::codex::CodexClient {
        client: reqwest::Client::new(),
        token: args.token,
        lang_server: lang_client,
        endpoint: args.endpoint,
        temperature: args.temp,
        cache,
    };

    // the typechecked and completed code(s). here if we get errors we exit with 1
    let good_ones: Vec<String> = match args.strategy.as_str() {
        "simple" => {
            let printed = codex
                .lang_server
                .lock()
                .await
                .pretty_print(&file_contents, "_hole_")
                .await
                .unwrap();

            println!("pretty:\n{}", printed);

            let query = CompletionQuery::new(printed, args.n, args.retries, args.fallback);

            let resp = match codex.complete(query).await {
                Ok(r) => r,
                Err(CodexError::RateLimit(r)) => {
                    eprintln!("Rate limited, but got {} completions before.", r.len());
                    r
                }
                Err(e) => {
                    eprintln!("Fatal error: {}", e);
                    std::io::stderr().flush().unwrap();
                    std::process::exit(1);
                }
            };

            let lang_client = codex.lang_server.lock().await;
            let mut comps: Vec<String> = vec![];
            for (i, comp) in resp.into_iter().enumerate() {
                println!("comp {}:\n {}", i, comp);
                let type_checks = lang_client.type_check(&comp).await.unwrap();
                if type_checks {
                    comps.push(comp);
                }
                if comps.len() >= args.stop_at {
                    break;
                }
            }
            comps
        }
        "tree" => todo!("tree completion"),
        _ => {
            eprintln!("Unknown strategy, {}", args.strategy);
            std::process::exit(1);
        }
    };
    std::io::stdout().flush().unwrap();

    if good_ones.is_empty() {
        eprintln!("No completions type checked");
        std::io::stderr().flush().unwrap();
        std::process::exit(1);
    }

    println!("completed:\n");
    for comp in &good_ones {
        println!("{}", comp);
    }

    // if the completed dir does not exist, create it
    let output_dir = std::path::Path::new(&args.output);
    if !output_dir.exists() {
        tokio::fs::create_dir_all(output_dir).await.unwrap();
    }

    if let Some(cache) = &codex.cache {
        let mut cache = cache.lock().await;
        for comp in &good_ones {
            // cache.cache(&comp).await.unwrap();
        }
    }

    // write to the output dir
    for (i, comp) in good_ones.into_iter().enumerate() {
        let output_path = format!("{}/{}.{}", args.output, i, args.lang);
        tokio::fs::write(&output_path, comp).await.unwrap();
    }
}
