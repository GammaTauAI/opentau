use std::{io::Write, sync::Arc};

use codex_types::{
    codex::{CodexError, EditReq, EditResp, EditRespError},
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

    /// Output file path
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

    let codex = codex_types::codex::CodexClient {
        client: reqwest::Client::new(),
        token: args.token,
        lang_server: lang_client,
        endpoint: args.endpoint,
        temperature: args.temp,
    };

    // the completed code. here if we get errors we exit with 1
    let completed: String = match args.strategy.as_str() {
        "simple" => {
            let printed = codex
                .lang_server
                .lock()
                .await
                .pretty_print(&file_contents, "_hole_")
                .await
                .unwrap();

            println!("pretty:\n{}", printed);

            let resp = match codex
                .complete(&printed, args.n, args.retries, args.fallback)
                .await
            {
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
            let mut maybe_comp: Option<String> = None;
            for (i, comp) in resp.into_iter().enumerate() {
                println!("comp {}:\n {}", i, comp);
                let type_checks = lang_client.type_check(&comp).await.unwrap();
                if type_checks {
                    maybe_comp = Some(comp);
                    break;
                }
            }
            maybe_comp.unwrap_or_else(|| {
                eprintln!("No completions type checked");
                std::io::stderr().flush().unwrap();
                std::process::exit(1);
            })
        }
        "tree" => todo!("tree completion"),
        _ => {
            eprintln!("Unknown strategy, {}", args.strategy);
            std::process::exit(1);
        }
    };
    std::io::stdout().flush().unwrap();
    println!("completed:\n {}", completed);

    tokio::fs::write(&args.output, completed).await.unwrap();
}
