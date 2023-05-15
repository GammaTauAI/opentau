use std::{str::FromStr, sync::Arc};

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::{socket::SocketError, tree::CodeBlockTree, typedef_gen::ObjectInfoMap};

pub mod py; // the python server
pub mod ts; // the typescript server

/// The kinds of problems that can occur when running the heuristics on a completion.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum CheckProblem {
    /// The completion still has holes or undefined types.
    NotComplete,
    /// The completion added/removed code that isn't a type.
    ChangedCode,
    /// The completion added/removed comments.
    ChangedComments,
}

impl CheckProblem {
    /// Returns all the check problems that can occur.
    pub fn all() -> Vec<CheckProblem> {
        vec![
            CheckProblem::NotComplete,
            CheckProblem::ChangedCode,
            CheckProblem::ChangedComments,
        ]
    }
}

impl<'a> Deserialize<'a> for CheckProblem {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'a>,
    {
        let s = String::deserialize(deserializer)?;
        match s.as_str() {
            "NotComplete" => Ok(CheckProblem::NotComplete),
            "ChangedCode" => Ok(CheckProblem::ChangedCode),
            "ChangedComments" => Ok(CheckProblem::ChangedComments),
            _ => Err(serde::de::Error::custom(format!(
                "invalid CheckProblem: {s}"
            ))),
        }
    }
}

/// The kinds of statements that can be annotated by the language server.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum AnnotateType {
    /// Variable declaration
    VarDecl,
    /// Function declaration
    FuncDecl,
    /// Function expression (e.g. lambdas or arrow functions)
    FuncExpr,
    /// Class property
    ClassProp,
    /// Class method
    ClassMethod,
    /// Type declaration
    TypeDecl,
}

impl FromStr for AnnotateType {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "VarDecl" => Ok(AnnotateType::VarDecl),
            "FuncDecl" => Ok(AnnotateType::FuncDecl),
            "FuncExpr" => Ok(AnnotateType::FuncExpr),
            "ClassProp" => Ok(AnnotateType::ClassProp),
            "ClassMethod" => Ok(AnnotateType::ClassMethod),
            "TypeDecl" => Ok(AnnotateType::TypeDecl),
            _ => Err(()),
        }
    }
}

impl<'a> Deserialize<'a> for AnnotateType {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'a>,
    {
        let s = String::deserialize(deserializer)?;
        let annot = AnnotateType::from_str(&s)
            .map_err(|_| serde::de::Error::custom(format!("invalid AnnotateType: {s}")))?;
        Ok(annot)
    }
}

impl Serialize for AnnotateType {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match self {
            AnnotateType::VarDecl => serializer.serialize_str("VarDecl"),
            AnnotateType::FuncDecl => serializer.serialize_str("FuncDecl"),
            AnnotateType::FuncExpr => serializer.serialize_str("FuncExpr"),
            AnnotateType::ClassProp => serializer.serialize_str("ClassProp"),
            AnnotateType::ClassMethod => serializer.serialize_str("ClassMethod"),
            AnnotateType::TypeDecl => serializer.serialize_str("TypeDecl"),
        }
    }
}

impl AnnotateType {
    /// Returns a list of all the annotate types.
    pub fn all() -> Vec<AnnotateType> {
        vec![
            AnnotateType::VarDecl,
            AnnotateType::FuncDecl,
            AnnotateType::FuncExpr,
            AnnotateType::ClassProp,
            AnnotateType::ClassMethod,
            AnnotateType::TypeDecl,
        ]
    }

    /// Returns a list of all the annotate types, except for the given types in `exclude`.
    pub fn all_except(exclude: &[AnnotateType]) -> Vec<AnnotateType> {
        AnnotateType::all()
            .into_iter()
            .filter(|t| !exclude.contains(t))
            .collect()
    }
}

#[async_trait]
/// The language server commands that are available to the completion engine.
/// The `simple` strategy only requires the `pretty_print` and `check_complete` commands.
/// The `tree` strategy additionally requires `to_tree`, `stub`, `weave`, and `usages`.
/// For type definition generation, the `typedef_gen` and object_info` commands are required.
pub trait LangServerCommands {
    /// pretty print the given code, making all missing types the given type token.
    /// the `types` parameter specifies which types of code blocks should be annotated.
    async fn pretty_print(
        &self,
        code: &str,
        type_name: &str,
        types: &[AnnotateType],
    ) -> Result<String, LangServerError>;

    /// transforms the given code into a tree of code blocks
    async fn to_tree(&self, code: &str) -> Result<CodeBlockTree, LangServerError>;

    /// makes all functions/classes/methods that are one level deep into a stub
    async fn stub(&self, code: &str) -> Result<String, LangServerError>;

    /// checks if the given code is complete, comparing it to the original input.
    async fn check_complete(
        &self,
        original: &str,
        completed: &str,
    ) -> Result<(Vec<CheckProblem>, u16), LangServerError>;

    /// performs a type weaving operation on the given `original` code, such that the types of the
    /// `nettle` code are transplanted into the `original` code. The `level` parameter specifies the
    /// level of the tree where the `nettle` block is located relative to `original`.
    async fn weave(
        &self,
        original: &str,
        nettle: &str,
        level: usize,
    ) -> Result<String, LangServerError>;

    /// Produces a code block of usages of the given code block, and the number of usages in the
    /// usage block.
    ///
    /// # Example
    /// if you have the following `outer_block`:
    /// ```ts
    /// function hello(name) {
    ///     return "hello " + name + "!";
    /// }
    /// console.log(hello("world"));
    /// console.log(hello("Federico"));
    /// ```
    /// You should give as `inner_block` the following code:
    /// ```ts
    /// function hello(name) {
    ///    return "hello " + name + "!";
    /// }
    /// ```
    /// And you will be returned the following code:
    /// ```ts
    /// // Usages of hello are shown below:
    /// console.log(hello("world"));
    /// console.log(hello("Federico"));
    /// ```
    /// with the number of usages being 2.
    async fn usages(
        &self,
        outer_block: &str,
        inner_block: &str,
    ) -> Result<(String, usize), LangServerError>;

    /// Produces the object information map for the given code.
    /// The input should be the full code of the file. The produced
    /// identifiers in the map may be alpha-renamed, appended with `$[0-9]+`,
    /// which can be removed to get the original identifier.
    async fn object_info(&self, code: &str) -> Result<ObjectInfoMap, LangServerError>;

    /// Generates type definition templates for the given code. The produced output is going
    /// to be the given code with the templates added.
    /// For example, if you have the following code (TypeScript in this case):
    /// ```ts
    /// function hello(obj) {
    ///    return "hello " + obj.firstName + " " + obj.lastName + "!";
    /// }
    /// ```
    ///
    /// The output will be:
    /// ```ts
    /// interface _hole_ {
    ///     firstName,
    ///     lastName,
    /// }
    ///
    /// function hello(obj) {
    ///    return "hello " + obj.firstName + " " + obj.lastName + "!";
    /// }
    /// ```
    async fn typedef_gen(&self, code: &str) -> Result<String, LangServerError>;
}

/// This is the trait that defines operations on the language server.
#[async_trait]
pub trait LangServer: LangServerCommands + std::fmt::Debug {
    /// create a new server socket connection, given a path to the language server executable
    async fn make(path: &str) -> Result<Self, LangServerError>
    where
        Self: std::marker::Sized;

    /// type checks the given code. returns 0 if there are no errors, returns the
    /// number of errors otherwise.
    async fn type_check(&self, code: &str) -> Result<usize, LangServerError>;

    /// produces the Any type for the given language.
    /// for example, in TypeScript, this would be `any`.
    fn any_type(&self) -> String;

    /// Produces a parser function that can parse out a type from the given code.
    /// The target function may require to enable features of the crate. If
    /// the feature is disabled or the language does not support it, None is returned.
    fn get_type_parser(&self) -> Option<Box<dyn Fn(&str) -> Option<String> + Sync + Send>>;
}

pub type ArcLangServer = Arc<dyn LangServer + Send + Sync>;

/// Request to the language server with a given command and text
/// in the format of {cmd: "the-cmd", text: "the-text"}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LSReq {
    pub cmd: String,
    pub text: String,
}

/// Request to the language server for the printer command.
/// in the format of {cmd: "the-cmd", text: "the-text", typeName: "the-type-name"}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LSPrintReq {
    pub cmd: String,
    pub text: String,
    #[serde(rename = "typeName")]
    pub type_name: String,
    pub types: Vec<AnnotateType>,
}

/// Request to the language server for the check command.
/// in the format of {cmd: "the-cmd", text: "the-completed-text", original: "the-original-text"}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LSCheckReq {
    pub cmd: String,
    pub text: String,
    pub original: String,
}

/// Request to the language server for the weave command.
/// in the format of {cmd: "the-cmd", text: "the-original-text",
///                   nettle: "the-nettle-text", level: 0}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LSWeaveReq {
    pub cmd: String,
    pub text: String,
    pub nettle: String,
    pub level: usize,
}

/// Request to the language server, for the usages command.
/// in the format of {cmd: "the-cmd", text: "the-outer-block",
///                   innerBlock: "the-inner-block"}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LSUsagesReq {
    pub cmd: String,
    pub text: String, // NOTE: this is outer_block
    #[serde(rename = "innerBlock")]
    pub inner_block: String,
}

#[derive(Debug, Clone, Error)]
pub enum LangServerError {
    #[error("Language client error: {0}")]
    LC(String), // actual error from the language client
    #[error("Could not spawn language server")]
    ProcessSpawn,
    #[error("Socket IO error")]
    SocketIO,
}

impl From<SocketError> for LangServerError {
    fn from(e: SocketError) -> Self {
        match e {
            SocketError::Io(_) | SocketError::Serde(_) => LangServerError::SocketIO,
            SocketError::Service(s) => LangServerError::LC(s),
        }
    }
}

/// Implements the LangServerCommands trait for a given language server.
///
/// # IMPORTANT
/// The language server must have a `socket` field of type `SocketAbstraction`.
#[macro_export]
macro_rules! impl_langserver_commands {
    ($name:ident) => {
        #[async_trait::async_trait]
        impl $crate::langserver::LangServerCommands for $name {
            async fn pretty_print(
                &self,
                code: &str,
                type_name: &str,
                types: &[$crate::langserver::AnnotateType],
            ) -> Result<String, $crate::langserver::LangServerError> {
                let req = $crate::langserver::LSPrintReq {
                    cmd: "print".to_string(),
                    text: base64::encode(code),
                    type_name: type_name.to_string(),
                    types: types.to_vec(),
                };

                use $crate::socket::SendToSocket;
                let resp = self
                    .socket
                    .send_req(serde_json::to_value(&req).unwrap())
                    .await?;
                // decode the response
                let resp = base64::decode(resp["text"].as_str().unwrap()).unwrap();

                Ok(String::from_utf8(resp).unwrap())
            }

            async fn to_tree(
                &self,
                code: &str,
            ) -> Result<$crate::tree::CodeBlockTree, $crate::langserver::LangServerError> {
                let req = $crate::langserver::LSReq {
                    cmd: "tree".to_string(),
                    text: base64::encode(code),
                };

                use $crate::socket::SendToSocket;
                let resp = self
                    .socket
                    .send_req(serde_json::to_value(&req).unwrap())
                    .await?;

                // decode the response
                let tree = base64::decode(resp["text"].as_str().unwrap()).unwrap();

                Ok(serde_json::from_slice(&tree).unwrap())
            }

            async fn stub(
                &self,
                code: &str,
            ) -> Result<String, $crate::langserver::LangServerError> {
                let req = $crate::langserver::LSReq {
                    cmd: "stub".to_string(),
                    text: base64::encode(code),
                };

                use $crate::socket::SendToSocket;
                let resp = self
                    .socket
                    .send_req(serde_json::to_value(&req).unwrap())
                    .await?;
                // decode the response
                let resp = base64::decode(resp["text"].as_str().unwrap()).unwrap();

                Ok(String::from_utf8(resp).unwrap())
            }

            async fn check_complete(
                &self,
                original: &str,
                completed: &str,
            ) -> Result<
                (Vec<$crate::langserver::CheckProblem>, u16),
                $crate::langserver::LangServerError,
            > {
                // encode original and completed into json: {original: "", completed: ""}
                let req = $crate::langserver::LSCheckReq {
                    cmd: "check".to_string(),
                    text: base64::encode(completed),
                    original: base64::encode(original),
                };
                use $crate::socket::SendToSocket;
                let resp = self
                    .socket
                    .send_req(serde_json::to_value(&req).unwrap())
                    .await?;

                let problems_json = resp["problems"].as_array().unwrap();
                let mut problems = Vec::new();
                for p in problems_json {
                    problems.push(serde_json::from_value(p.clone()).unwrap());
                }

                Ok((
                    problems,
                    resp["score"].as_u64().unwrap().try_into().unwrap(),
                ))
            }

            async fn weave(
                &self,
                original: &str,
                nettle: &str,
                level: usize,
            ) -> Result<String, $crate::langserver::LangServerError> {
                let req = $crate::langserver::LSWeaveReq {
                    cmd: "weave".to_string(),
                    text: base64::encode(original),
                    nettle: base64::encode(nettle),
                    level,
                };

                use $crate::socket::SendToSocket;
                let resp = self
                    .socket
                    .send_req(serde_json::to_value(&req).unwrap())
                    .await?;
                // decode the response
                let resp = base64::decode(resp["text"].as_str().unwrap()).unwrap();

                Ok(String::from_utf8(resp).unwrap())
            }

            async fn usages(
                &self,
                outer_block: &str,
                inner_block: &str,
            ) -> Result<(String, usize), $crate::langserver::LangServerError> {
                let req = $crate::langserver::LSUsagesReq {
                    cmd: "usages".to_string(),
                    text: base64::encode(outer_block),
                    inner_block: base64::encode(inner_block),
                };

                use $crate::socket::SendToSocket;
                let resp = self
                    .socket
                    .send_req(serde_json::to_value(&req).unwrap())
                    .await?;
                // decode the response
                let num_usages = resp["numUsages"].as_u64().unwrap();
                let resp = base64::decode(resp["text"].as_str().unwrap()).unwrap();

                Ok((
                    String::from_utf8(resp).unwrap(),
                    num_usages.try_into().unwrap(),
                ))
            }

            async fn object_info(
                &self,
                code: &str,
            ) -> Result<$crate::typedef_gen::ObjectInfoMap, $crate::langserver::LangServerError>
            {
                let req = $crate::langserver::LSReq {
                    cmd: "objectInfo".to_string(),
                    text: base64::encode(code),
                };

                use $crate::socket::SendToSocket;
                let resp = self
                    .socket
                    .send_req(serde_json::to_value(&req).unwrap())
                    .await?;
                // decode the response
                let resp = base64::decode(resp["text"].as_str().unwrap()).unwrap();

                Ok(serde_json::from_slice(&resp).unwrap())
            }

            async fn typedef_gen(
                &self,
                code: &str,
            ) -> Result<String, $crate::langserver::LangServerError> {
                let req = $crate::langserver::LSReq {
                    cmd: "typedefGen".to_string(),
                    text: base64::encode(code),
                };

                use $crate::socket::SendToSocket;
                let resp = self
                    .socket
                    .send_req(serde_json::to_value(&req).unwrap())
                    .await?;
                // decode the response
                let resp = base64::decode(resp["text"].as_str().unwrap()).unwrap();

                Ok(String::from_utf8(resp).unwrap())
            }
        }
    };
}
