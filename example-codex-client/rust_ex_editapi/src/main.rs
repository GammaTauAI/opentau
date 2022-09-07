use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
struct EditReq {
    model: String,
    input: String,
    instruction: String,
    n: usize,
}

#[derive(Debug, Deserialize, Serialize)]
struct EditResp {
    choices: Vec<EditRespChoice>,
}

#[derive(Debug, Deserialize, Serialize)]
struct EditRespChoice {
    text: String,
    index: usize,
}

impl std::fmt::Display for EditResp {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        writeln!(f, "Choices given: ")?;
        for choice in &self.choices {
            writeln!(f, "- {}:\n{}", choice.index, choice.text)?;
        }
        Ok(())
    }
}

#[tokio::main]
async fn main() {
    // get auth token from env
    let token = std::env::var("CODEX_TOKEN").expect("CODEX_TOKEN not set");

    // get argv[1] and read the file into a string
    let filename = std::env::args().nth(1).expect("no filename given");
    let input = std::fs::read_to_string(filename).expect("could not read file");

    let client = reqwest::Client::new();
    let req = client
        .post("https://api.openai.com/v1/edits")
        .bearer_auth(token)
        .header("Content-Type", "application/json")
        .body(
            serde_json::to_string(&EditReq {
                model: "code-davinci-edit-001".to_string(),
                input,
                n: 3,
                // instruction: "Insert types for each comment /* insert type here */ and remove that comment".to_string(),
                instruction: "Substitute the token \"***\" with the correct type.".to_string(),
            })
            .unwrap(),
        );

    let res = req.send().await.unwrap();
    let body = res.text().await.unwrap();
    let resp: EditResp = serde_json::from_str(&body)
        .unwrap_or_else(|_| panic!("could not parse response: {}", body));
    println!("{}", resp);
}
