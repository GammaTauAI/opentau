use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct EditReq {
    pub model: String,
    pub input: String,
    pub instruction: String,
    pub n: usize,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct EditResp {
    pub choices: Vec<EditRespChoice>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct EditRespChoice {
    pub text: String,
    pub index: usize,
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

