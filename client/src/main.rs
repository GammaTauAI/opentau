use rust_ex::{
    codex::{EditReq, EditResp},
    langclient::{ts::TsClient, LangClient},
};

#[tokio::main]
async fn main() {
    // get auth token from env
    // let token = std::env::var("CODEX_TOKEN").expect("CODEX_TOKEN not set");

    // get argv[1] and read the file into a string
    // let filename = std::env::args().nth(1).expect("no filename given");
    // let input = std::fs::read_to_string(filename).expect("could not read file");

    // let client = reqwest::Client::new();
    // let req = client
    // .post("https://api.openai.com/v1/edits")
    // .bearer_auth(token)
    // .header("Content-Type", "application/json")
    // .body(
    // serde_json::to_string(&EditReq {
    // model: "code-davinci-edit-001".to_string(),
    // input,
    // n: 3,
    // instruction: "Substitute the token \"***\" with the correct type.".to_string(),
    // })
    // .unwrap(),
    // );

    // let res = req.send().await.unwrap();
    // let body = res.text().await.unwrap();
    // let resp: EditResp = serde_json::from_str(&body)
    // .unwrap_or_else(|_| panic!("could not parse response: {}", body));
    // println!("{}", resp);

    // resolve path ../ts-ast, this is temporary of course!
    // TODO: remove this crap
    let client_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("ts-ast")
        .to_str()
        .unwrap()
        .to_string();

    let langclient = TsClient::make(&client_path).await.unwrap();
    println!("langclient: {:?}", langclient);
}
