use std::sync::Arc;

use codex_types::{
    codex::{EditReq, EditResp},
    langclient::{ts::TsClient, LangClient},
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

    /// Completion strategy. Either: {"simple": simple completion,
    /// "tree": tree completion,
    /// "fallback": tree completion with fallback to "any" type}
    #[clap(short, long, value_parser, default_value = "simple")]
    strategy: String,

    /// The number of completions to return
    #[clap(short, long, value_parser, default_value = "1")]
    n: usize,

    /// The number of retries to make to codex
    #[clap(short, long, value_parser, default_value = "3")]
    retries: usize,
}

impl Args {
    async fn lang_client(&self) -> Arc<Mutex<dyn LangClient + Send + Sync>> {
        match self.lang.as_str() {
            "ts" => {
                let client_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                    .parent()
                    .unwrap()
                    .join("ts-ast")
                    .to_str()
                    .unwrap()
                    .to_string();
                Arc::new(Mutex::new(TsClient::make(&client_path).await.unwrap()))
            }
            "py" => todo!("python client"),
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
        lang_client,
        file_contents,
    };

    // the completed code. here if we get errors we exit with 1
    let completed: String = match args.strategy.as_str() {
        "simple" => {
            let printed = codex
                .lang_client
                .lock()
                .await
                .pretty_print(&codex.file_contents, "_hole_")
                .await
                .unwrap();

            println!("pretty:\n{}", printed);

            let resp = codex.complete(&printed, args.n, args.retries).await.unwrap();
            let lang_client = codex.lang_client.lock().await;
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
                std::process::exit(1);
            })
        }
        "tree" => todo!("tree completion"),
        "fallback" => todo!("tree completion with fallback"),
        _ => {
            eprintln!("Unknown strategy, {}", args.strategy);
            std::process::exit(1);
        }
    };
    println!("completed:\n {}", completed);

    tokio::fs::write(&args.output, completed).await.unwrap();
}
