use std::sync::Arc;

use codex_types::{
    langserver::{ts::TsServer, LangServer},
    tree::NaiveCompletionLevels,
};
use tokio::sync::Mutex;

#[tokio::main]
async fn main() {
    // get auth token from env
    let token = std::env::var("CODEX_TOKEN").expect("CODEX_TOKEN not set");

    // get argv[1] and read the file into a string
    let filename = std::env::args().nth(1).expect("no filename given");
    let input = std::fs::read_to_string(filename).expect("could not read file");

    // resolve path ../ts-ast, this is temporary of course!
    // TODO: remove this crap
    let client_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("ts-ast")
        .to_str()
        .unwrap()
        .to_string();

    let lang_server = Arc::new(Mutex::new(TsServer::make(&client_path).await.unwrap()));
    let codex = codex_types::codex::CodexClient {
        client: reqwest::Client::new(),
        token,
        lang_server,
        temperature: 1.0,
        endpoint: "https://api.openai.com/v1/edits".to_string(),
        cache: None,
    };

    // {
    // let printed = codex
    // .lang_server
    // .lock()
    // .await
    // .pretty_print(&codex.file_contents, "_hole_")
    // .await
    // .unwrap();

    // println!("pretty:\n{}", printed);

    // let resp = codex.complete(&printed, 1, 4, false).await.unwrap();
    // for (i, comp) in resp.into_iter().enumerate() {
    // println!("comp {}:\n {}", i, comp);
    // }
    // }

    // testing out "tree"
    {
        let tree = codex
            .lang_server
            .lock()
            .await
            .to_tree(&input)
            .await
            .unwrap();
        let naive: NaiveCompletionLevels = tree.into();
        println!("tree: {:#?}", naive);
    }

    // testing out "stub"
    // {
    // let stub = codex
    // .lang_server
    // .lock()
    // .await
    // .stub(&codex.file_contents)
    // .await
    // .unwrap();
    // println!("stub: {}", stub);
    // }
}
