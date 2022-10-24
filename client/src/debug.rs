use std::sync::Arc;

use codex_types::{
    codex::CodexClientBuilder,
    langserver::{ts::TsServer, LangServer},
    tree::{NaiveCompletionLevels, TreeCompletion},
};

#[tokio::main]
async fn main() {
    // get auth token from env
    let token = std::env::var("CODEX_TOKEN").expect("CODEX_TOKEN not set");

    // get argv[1] and read the file into a string
    let filename = std::env::args().nth(1).expect("no filename given");
    let input = std::fs::read_to_string(filename).expect("could not read file");

    // resolve path ../ts-ast, this is temporary of course!
    let client_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("ts-ast")
        .to_str()
        .unwrap()
        .to_string();

    let lang_server = Arc::new(TsServer::make(&client_path).await.unwrap());
    let codex = CodexClientBuilder::new(vec![token], lang_server).build();

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
        let tree = codex.get_ls().to_tree(&input).await.unwrap();
        let mut naive: NaiveCompletionLevels = tree.into();
        println!("tree: {:#?}", naive);
        naive.tree_complete(codex).await;
        println!("root comp:\n {}", naive.levels[0].nodes[0].code);
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
