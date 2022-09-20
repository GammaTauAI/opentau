use rust_ex::{
    codex::{EditReq, EditResp},
    langclient::{ts::TsClient, LangClient},
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

    let lang_client = Box::new(Mutex::new(TsClient::make(&client_path).await.unwrap()));
    let codex = rust_ex::codex::CodexClient {
        client: reqwest::Client::new(),
        token,
        lang_client,
        file_contents: input,
    };

    // TODO: make this into actual logic
    {
        let printed = codex
            .lang_client
            .lock()
            .await
            .pretty_print(&codex.file_contents)
            .await
            .unwrap();

        println!("pretty:\n{}", printed);

        let resp = codex.complete(&printed, 1, 3).await.unwrap();
        println!("{}", resp);
    }

    // testing out "tree"
    {
        let tree = codex
            .lang_client
            .lock()
            .await
            .to_tree(&codex.file_contents)
            .await
            .unwrap();
        println!("tree: {:#?}", tree);
    }

    // testing out "stub"
    {
        let stub = codex
            .lang_client
            .lock()
            .await
            .stub(&codex.file_contents)
            .await
            .unwrap();
        println!("stub: {}", stub);
    }
}
