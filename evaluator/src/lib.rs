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

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct EvalSpec {
    pub model: String,
    pub strategy: String,
    pub local_model_socket: Option<String>,
    pub remote_model_key: Option<String>,
    pub language: String,
    pub results_path: String,
    pub dataset_path: String,
    pub num_comps: usize,
    pub retries: usize,
    pub fallback: bool,
    pub stop_at: usize,
    pub enable_defgen: bool,
    pub enable_usages: bool,
    pub enable_stubbing: bool,
    pub depth_limit: Option<usize>,
    pub max_type_quality: u16,
    pub temperature: f64,
    pub types: Vec<AnnotateType>,
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

    pub async fn get_completion_engine(&self) -> ArcCompletionEngine {
        let langserver = self.get_langserver().await;
        let model: ArcCompletionModel = match self.model.as_str() {
            "santacoder" | "incoder" => {
                let mut builder = LocalModelClientBuilder::new(self.model.clone());
                if let Some(endpoint) = &self.local_model_socket {
                    builder = builder.socket_path(endpoint.clone());
                }

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

pub async fn read_dataset(path: &str) -> Vec<serde_json::Value> {
    let dataset_path = if path.starts_with('/') {
        path.to_string()
    } else {
        let cargo_path = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        format!("{cargo_path}/{path}")
    };

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
    let results_path = if path.starts_with('/') {
        path.to_string()
    } else {
        let cargo_path = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        format!("{cargo_path}/{path}")
    };

    if tokio::fs::metadata(results_path.clone()).await.is_ok() {
        println!("File {results_path} already exists, do you want to delete it or resume?\n\td: delete\n\tr: resume\n\tc: cancel");
        let mut buf = [0; 1];
        let mut stdin = tokio::io::stdin();
        stdin.read_exact(&mut buf).await.unwrap();
        if buf[0] == b'd' {
            tokio::fs::remove_file(results_path).await.unwrap();
            None
        } else if buf[0] == b'r' {
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
                results.push(element);
            }
            Some(results)
        } else {
            println!("Exiting");
            std::process::exit(0);
        }
    } else {
        None
    }
}

pub async fn write_results(results: &Vec<ResultElement>, path: &str) {
    let results_path = if path.starts_with('/') {
        path.to_string()
    } else {
        let cargo_path = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        format!("{cargo_path}/{path}")
    };

    let mut lines = String::new();
    for result in results {
        let line = serde_json::to_string(&result).unwrap_or_else(|_| {
            eprintln!("Failed to serialize result");
            std::process::exit(1);
        });
        lines.push_str(&line);
        lines.push('\n');
    }
    tokio::fs::write(results_path, lines)
        .await
        .unwrap_or_else(|_| {
            eprintln!("Failed to write results");
            std::process::exit(1);
        });
}

pub async fn append_result(result: &ResultElement, path: &str) {
    let results_path = if path.starts_with('/') {
        path.to_string()
    } else {
        let cargo_path = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        format!("{cargo_path}/{path}")
    };

    let line = serde_json::to_string(&result).unwrap_or_else(|_| {
        eprintln!("Failed to serialize result");
        std::process::exit(1);
    });
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
    file.write_all(b"\n").await.unwrap_or_else(|_| {
        eprintln!("Failed to write to results file");
        std::process::exit(1);
    });
}
