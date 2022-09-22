use std::sync::Arc;

use rust_ex::{
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

    /// The target language
    /// Either `ts` or `py`
    #[clap(short, long, value_parser, default_value = "ts")]
    lang: String,

    /// The target file
    #[clap(short, long, value_parser)]
    file: String,

    /// Completion strategy
    /// "simple" - simple completion
    /// "tree" - tree completion
    /// "fallback" - tree completion with fallback to "any" type
    #[clap(short, long, value_parser, default_value = "simple")]
    strategy: String,
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

    let codex = rust_ex::codex::CodexClient {
        client: reqwest::Client::new(),
        token: args.token,
        lang_client,
        file_contents,
    };

    match args.strategy.as_str() {
        "simple" => todo!("simple completion"),
        "tree" => todo!("tree completion"),
        "fallback" => todo!("tree completion with fallback"),
        _ => {
            eprintln!("Unknown strategy, {}", args.strategy);
            std::process::exit(1);
        }
    }
}
