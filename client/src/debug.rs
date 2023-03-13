use std::sync::Arc;

use opentau::{
    completion::{codex::CodexClientBuilder, CompletionEngine},
    langserver::{ts::TsServer, LangServer},
};

// this is a debug binary to test some opentau functionality
// sorry for the mess!

#[tokio::main]
async fn main() {
    // get auth token from env
    let token = std::env::var("CODEX_TOKEN").expect("CODEX_TOKEN not set");

    // get argv[1] and read the file into a string
    let filename = std::env::args().nth(1).expect("no filename given");
    let input = std::fs::read_to_string(filename).expect("could not read file");

    // resolve path ../ts-compiler, this is temporary of course!
    let client_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("ts-compiler")
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

    // testing out "naive tree"
    // {
    // let tree = codex.get_ls().to_tree(&input).await.unwrap();
    // let mut naive: NaiveCompletionLevels = NaiveCompletionLevels::prepare(tree, codex.get_ls())
    // .await
    // .unwrap();
    // println!("tree: {:#?}", naive);
    // let codex = codex.clone();
    // naive.tree_complete(codex).await;
    // println!("root comp:\n {}", naive.levels[0].nodes[0].code);
    // }

    // testing out "tree v2"
    // {
    // let tree = codex.get_ls().to_tree(&input).await.unwrap();
    // let mut comps: CompletionLevels = CompletionLevels::prepare(tree, codex.get_ls())
    // .await
    // .unwrap();
    // comps.retries = 1;
    // comps.num_comps = 3;
    // // comps.fallback = true;
    // println!("tree: {comps:#?}");
    // comps.tree_complete(Arc::new(codex)).await;
    // println!("root comps:\n");
    // for (i, comp) in comps.levels[0].nodes[0].completed.iter().enumerate() {
    // println!("{i}:\n{comp}");
    // }
    // }

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

    // testing out "object_info"
    //{
        //let object_info = codex.get_ls().object_info(&input).await.unwrap();
        //println!("object_info: {object_info:#?}");
    //}

    // test "typedef_gen"
    {
        let typedef_gen_template = codex.get_ls().typedef_gen(&input).await.unwrap();
        println!("typedef_gen:\n{}", typedef_gen_template);
    }
}
