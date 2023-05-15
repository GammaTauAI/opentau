use std::sync::Arc;

use opentau::{
    completion::{
        local::LocalModelClientBuilder, ArcCompletionEngine, ArcCompletionModel,
        CompletionClientBuilder, TypecheckedCompletion,
    },
    get_path_from_rootdir,
    langserver::{ts::TsServer, AnnotateType, ArcLangServer, LangServer},
    main_strategies::{MainCtx, MainStrategy, SimpleStrategy, TreeStrategy},
    tree::stats::{ArcTreeAlgoStats, TreeAlgoStats},
};
use serde::{Deserialize, Serialize};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

pub mod runner;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct EvalSpec {
    /// The model to use. e.g. "santacoder"
    pub model: String,
    /// The strategy to use. "simple" or "tree"
    pub strategy: String,
    /// For local models, this is a comma-separated list of socket paths to connect to.
    /// Each socket should be connected to a local model server, e.g. santacoder-server.
    pub local_model_socket: Option<String>,
    /// This is a key for remote models, e.g. OpenAI key for OpenAI's davinci-edit
    pub remote_model_key: Option<String>,
    /// This is the language that is being evaluated. e.g. "ts"
    pub language: String,
    /// This is the path to the results file. This is where the results will be stored.
    pub results_path: String,
    /// This is the path to the dataset file. This is where the dataset is stored and read from.
    pub dataset_path: String,
    /// This is the number of completions to generate per node.
    #[serde(default = "eval_spec_defaults::default_num_comps")]
    pub num_comps: usize,
    /// This is the number of times to retry querying the model. This
    /// is a legacy option that is not used much anymore. Set to 1 to disable.
    #[serde(default = "eval_spec_defaults::default_retries")]
    pub retries: usize,
    /// This is a boolean that determines whether to generate an extra completion
    /// that has all type holes filled with the any type.
    #[serde(default = "eval_spec_defaults::default_fallback")]
    pub fallback: bool,
    /// This is the hyperparameter that determines the maximum number of completions
    /// per node. Set to a big number, like 400 for best results.
    #[serde(default = "eval_spec_defaults::default_stop_at")]
    pub stop_at: usize,
    /// This is an option to enable definition generation. At this time, this is not
    /// fully supported.
    #[serde(default = "eval_spec_defaults::default_enable_defgen")]
    pub enable_defgen: bool,
    /// This is an option to enable usage statement prompt-engineering in the tree strategy.
    /// Should be enabled, only disable for ablation.
    #[serde(default = "eval_spec_defaults::default_enable_usages")]
    pub enable_usages: bool,
    /// This is an option to enable stubbing of child nodes in the tree strategy.
    /// We currently evaluate with this disabled, but can be enabled for
    /// models with tight context windows.
    #[serde(default = "eval_spec_defaults::default_enable_stubbing")]
    pub enable_stubbing: bool,
    /// This enables the type parser at the completion generation stage. Types
    /// that are generated are often malformed, so a parser may help in extracting
    /// the type information. Enable this for best results.
    #[serde(default = "eval_spec_defaults::default_enable_parser")]
    pub enable_parser: bool,
    /// This enables the syntax checker at the heuristic stage. This is enabled
    /// most of the times and disabled only for ablation.
    #[serde(default = "eval_spec_defaults::default_enable_checkproblems")]
    pub enable_checkproblems: bool,
    /// This depth-limits the tree strategy. It may be useful for very deep
    /// trees, but is not recommended for best results. If this is set to 1,
    /// the tree strategy will behave like the simple strategy but will split
    /// for every definition; this can speed up evaluation significantly.
    /// This option is set to None for best results.
    #[serde(default = "eval_spec_defaults::default_depth_limit")]
    pub depth_limit: Option<usize>,
    /// This is the maximum type quality that is considered. Type quality here
    /// is measured by the heuristic, where a lower score is better, and the
    /// score is in the range of 0 to 1000. This should be set to 1000 for best
    /// results (disabled essentially).
    #[serde(default = "eval_spec_defaults::default_max_type_quality")]
    pub max_type_quality: u16,
    /// This is the temperature for the completion generation that is sent to
    /// the model. This should be set to 0.75 for best results, as it will
    /// provide diversity in the completions.
    #[serde(default = "eval_spec_defaults::default_temperature")]
    pub temperature: f64,
    /// These are the kind of types that will be inferred. In our evaluation,
    /// we enabled all types except for VarDecls.
    #[serde(default = "eval_spec_defaults::default_types")]
    pub types: Vec<AnnotateType>,
}

/// Default values for the evaluation spec deserializer.
mod eval_spec_defaults {
    pub(super) fn default_num_comps() -> usize {
        3
    }

    pub(super) fn default_retries() -> usize {
        1
    }

    pub(super) fn default_stop_at() -> usize {
        400
    }

    pub(super) fn default_enable_defgen() -> bool {
        false
    }

    pub(super) fn default_enable_usages() -> bool {
        true
    }

    pub(super) fn default_enable_stubbing() -> bool {
        false
    }

    pub(super) fn default_enable_parser() -> bool {
        true
    }

    pub(super) fn default_enable_checkproblems() -> bool {
        true
    }

    pub(super) fn default_max_type_quality() -> u16 {
        1000
    }

    pub(super) fn default_temperature() -> f64 {
        0.75
    }

    pub(super) fn default_depth_limit() -> Option<usize> {
        None
    }

    pub(super) fn default_fallback() -> bool {
        false
    }

    use opentau::langserver::AnnotateType;
    pub(super) fn default_types() -> Vec<AnnotateType> {
        AnnotateType::all_except(&[AnnotateType::VarDecl])
    }
}

impl EvalSpec {
    async fn get_langserver(&self) -> ArcLangServer {
        match self.language.as_str() {
            "ts" => {
                let path = get_path_from_rootdir("ts-compiler".to_string());
                Arc::new(
                    TsServer::make(&path)
                        .await
                        .expect("failed to make ts server"),
                )
            }
            _ => {
                eprintln!("Unknown language {}", self.language);
                std::process::exit(1);
            }
        }
    }

    pub async fn get_completion_engine(&self, endpoint: String) -> ArcCompletionEngine {
        let langserver = self.get_langserver().await;
        let model: ArcCompletionModel = match self.model.as_str() {
            "santacoder" | "incoder" => {
                let mut builder = LocalModelClientBuilder::new(self.model.clone());
                builder = builder.socket_path(endpoint.clone());

                Arc::new(
                    builder
                        .build()
                        .await
                        .unwrap_or_else(|_| panic!("failed to make {} client", self.model)),
                )
            }
            _ => {
                eprintln!("Unknown model {}", self.model);
                std::process::exit(1);
            }
        };
        let engine = CompletionClientBuilder::new(langserver, model)
            .temperature(self.temperature)
            .max_type_score(self.max_type_quality);
        Arc::new(engine.build())
    }

    /// factory for the strategy, also produces a TreeAlgoStats if
    /// the strategy is tree
    pub fn get_strategy(
        &self,
    ) -> (
        Box<dyn MainStrategy + Send + Sync>,
        Option<ArcTreeAlgoStats>,
    ) {
        match self.strategy.as_str() {
            "tree" => {
                let stats = TreeAlgoStats::default();
                let arc_stats = Some(std::sync::Arc::new(tokio::sync::Mutex::new(stats)));
                (
                    Box::new(TreeStrategy {
                        stats: arc_stats.clone(),
                    }),
                    arc_stats,
                )
            }
            "simple" => (Box::new(SimpleStrategy {}), None),
            _ => {
                eprintln!("Unknown strategy {}", self.strategy);
                std::process::exit(1);
            }
        }
    }

    pub fn make_main_ctx(&self, input_file: String, engine: ArcCompletionEngine) -> MainCtx {
        MainCtx {
            engine,
            file_contents: input_file,
            num_comps: self.num_comps,
            retries: self.retries,
            fallback: self.fallback,
            stop_at: self.stop_at,
            enable_type_check: true,
            enable_defgen: self.enable_defgen,
            enable_usages: self.enable_usages,
            enable_stubbing: self.enable_stubbing,
            depth_limit: self.depth_limit,
            types: self.types.clone(),
        }
    }

    pub fn get_endpoints(&self) -> Vec<String> {
        let endpoints = match self.local_model_socket {
            Some(ref sockets) => sockets.split(',').map(|s| s.to_string()).collect(),
            None => vec![self.remote_model_key.as_ref().unwrap().to_string()],
        };
        assert!(!endpoints.is_empty());
        endpoints
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ResultElement {
    pub dataset_elem: serde_json::Value,
    /// This is just for debugging purposes. If the system for some reason
    /// fails, we can see what the error was.
    pub failed_message: Option<String>,
    /// The evalspec that was used to generate this result.
    pub eval_spec: EvalSpec,
    /// If the strategy had any stats, they are stored here.
    pub stats: Option<TreeAlgoStats>,
    /// The completions that were generated, with typechecking information.
    pub completions: Vec<TypecheckedCompletion>,
}

fn resolve_path(path: &str) -> String {
    if path.starts_with('/') {
        path.to_string()
    } else {
        let cargo_path = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        format!("{cargo_path}/{path}")
    }
}

fn result_to_line(result: &ResultElement) -> String {
    let mut line = serde_json::to_string(result).unwrap();
    line.push('\n');
    line
}

pub async fn read_dataset(path: &str) -> Vec<serde_json::Value> {
    let dataset_path = resolve_path(path);
    let dataset_file = tokio::fs::read_to_string(dataset_path)
        .await
        .unwrap_or_else(|_| {
            eprintln!("Failed to read input file");
            std::process::exit(1);
        });
    let mut dataset = Vec::new();
    for line in dataset_file.lines() {
        let element = serde_json::from_str(line).unwrap_or_else(|_| {
            eprintln!("Failed to parse input file");
            std::process::exit(1);
        });
        dataset.push(element);
    }
    dataset
}

/// Checks if the file exists, and asks the user if they want to delete it or resume from it.
pub async fn check_file_delete(path: &str) -> Option<Vec<ResultElement>> {
    let results_path = resolve_path(path);
    if tokio::fs::metadata(results_path.clone()).await.is_ok() {
        println!("File {results_path} already exists, do you want to delete it or resume?");
        println!("\td: delete\n\tr: resume\n\tp: rerun panicked\n\tc: cancel");
        let mut buf = [0; 1];
        let mut stdin = tokio::io::stdin();
        stdin.read_exact(&mut buf).await.unwrap();
        let choice = buf[0];
        if choice == b'd' {
            tokio::fs::remove_file(results_path).await.unwrap();
            None
        } else if choice == b'r' || choice == b'p' {
            let results_file = tokio::fs::read_to_string(results_path)
                .await
                .unwrap_or_else(|_| {
                    eprintln!("Failed to read input file");
                    std::process::exit(1);
                });
            let mut results = Vec::new();
            for line in results_file.lines() {
                let element: ResultElement = serde_json::from_str(line).unwrap_or_else(|_| {
                    eprintln!("Failed to parse input file");
                    std::process::exit(1);
                });

                // if we are rerunning panicked, we only want to run the panicked ones,
                // so we only add the one that didn't panic
                if choice == b'p' && element.failed_message.is_some() {
                    continue;
                }

                results.push(element);
            }
            Some(results)
        } else {
            // something else or c
            println!("Exiting");
            std::process::exit(0);
        }
    } else {
        None
    }
}

pub async fn write_results(results: &Vec<ResultElement>, path: &str) {
    let results_path = resolve_path(path);
    let mut lines = String::new();
    for result in results {
        let line = result_to_line(result);
        lines.push_str(&line);
    }
    tokio::fs::write(results_path, lines)
        .await
        .unwrap_or_else(|_| {
            eprintln!("Failed to write results");
            std::process::exit(1);
        });
}

pub async fn append_result(result: &ResultElement, path: &str) {
    let results_path = resolve_path(path);
    let line = result_to_line(result);
    let mut file = tokio::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(results_path)
        .await
        .unwrap_or_else(|_| {
            eprintln!("Failed to open results file");
            std::process::exit(1);
        });
    file.write_all(line.as_bytes()).await.unwrap_or_else(|_| {
        eprintln!("Failed to write to results file");
        std::process::exit(1);
    });
}

fn get_content(element: &serde_json::Value) -> String {
    element["content_without_annotations"]
        .as_str()
        .unwrap_or_else(|| element["content"].as_str().unwrap())
        .to_string()
}

pub fn get_name(element: &serde_json::Value) -> String {
    element["hexsha"]
        .as_str()
        .unwrap_or_else(|| element["name"].as_str().unwrap())
        .to_string()
}
