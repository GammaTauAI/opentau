use std::{collections::HashMap, sync::Arc};

use crate::{check_file_delete, get_content, get_name, write_results, EvalSpec, ResultElement};
use opentau::{
    completion::{sort_completions, ArcCompletionEngine, CompletionError, TypecheckedCompletion},
    tree::stats::ArcTreeAlgoStats,
};
use tokio::{
    sync::{
        mpsc::{Receiver, Sender},
        Mutex,
    },
    task::JoinHandle,
};

/// We use an Arc Mutex here so that we have a shared pointer to the engine,
/// such that in panics, we can re-create the engine and restore the state.
pub type MutexEngine = Arc<Mutex<ArcCompletionEngine>>;

type MutexEngineSender = Sender<(usize, MutexEngine)>;

/// The Receiver is ArcMutexed such that it can be read from multiple threads.
type MutexEngineReceiver = Arc<Mutex<Receiver<(usize, MutexEngine)>>>;

pub struct RunnerState {
    pub results: Vec<ResultElement>,
    pub eval: EvalSpec,
    pub dataset: Vec<serde_json::Value>,
    pub endpoints: Vec<String>,
    pub e_tx: MutexEngineSender,
    pub e_rx: MutexEngineReceiver,
    pub done_tx: Sender<usize>,
    pub done_rx: Receiver<usize>,
}

/// Creates the engine channel, and populates it with the engines.
pub async fn create_engine_ch(
    eval: &EvalSpec,
    endpoints: &[String],
) -> (MutexEngineSender, MutexEngineReceiver) {
    let (e_tx, e_rx): (Sender<(usize, MutexEngine)>, _) =
        tokio::sync::mpsc::channel(endpoints.len());
    let e_rx = Arc::new(Mutex::new(e_rx));

    for (e_i, endpoint) in endpoints.iter().enumerate() {
        let engine = eval.get_completion_engine(endpoint.to_string()).await;
        let mutex_engine = Arc::new(Mutex::new(engine.clone()));
        e_tx.send((e_i, mutex_engine)).await.unwrap();
    }

    (e_tx, e_rx)
}

struct TaskResult {
    comps: Vec<TypecheckedCompletion>,
    maybe_error: Option<String>,
    maybe_arc_stats: Option<ArcTreeAlgoStats>,
    element: serde_json::Value,
}

impl RunnerState {
    pub async fn setup(eval: EvalSpec, dataset: Vec<serde_json::Value>) -> Self {
        let mut results: Vec<ResultElement> = Vec::new();

        let maybe_resume = check_file_delete(&eval.results_path).await;
        if let Some(resume) = maybe_resume {
            results = resume;
            println!("Resuming from {} results", results.len());
        }

        let endpoints = eval.get_endpoints();

        let (e_tx, e_rx) = create_engine_ch(&eval, &endpoints).await;

        let (done_tx, done_rx) = tokio::sync::mpsc::channel(1);

        RunnerState {
            results,
            eval,
            dataset,
            endpoints,
            e_tx,
            e_rx,
            done_tx,
            done_rx,
        }
    }

    fn spawn_eval_task(
        &self,
        element: serde_json::Value,
        i: usize,
        max_idx: usize,
    ) -> JoinHandle<TaskResult> {
        // a good healthy dose of cloning
        let e_tx = self.e_tx.clone();
        let e_rx = self.e_rx.clone();
        let done_tx = self.done_tx.clone();
        let eval = self.eval.clone();
        let endpoints = self.endpoints.clone();

        tokio::task::spawn(async move {
            // ask the channel for an engine
            let engine_pair = {
                let mut e_rx = e_rx.lock().await;
                e_rx.recv().await.unwrap()
            };
            let (e_i, ref mutex_engine) = engine_pair;

            println!(
                "###### RUNNING {} ({i}/{max_idx}) ######",
                get_name(&element)
            );

            let content = get_content(&element);
            let context =
                eval.make_main_ctx(content.to_string(), mutex_engine.lock().await.clone());
            let (strategy, maybe_arc_stats) = eval.get_strategy();

            // wrap in a task so that we can catch panics
            let inner_task = tokio::task::spawn(async move { strategy.run(context).await });
            let mut send_back = true;

            let (comps, maybe_error) = match inner_task.await {
                Ok(Ok(mut comps)) => {
                    println!("###### DONE {} ({i}/{max_idx}) ######", get_name(&element));
                    println!("#### Got {} completions! ####", comps.len());
                    for (i, comp) in comps.iter().enumerate() {
                        println!(
                            "{}: errors = {}, score = {}, fallbacked = {}",
                            i, comp.num_type_errors, comp.score, comp.fallbacked
                        );
                    }

                    sort_completions(&mut comps);

                    (comps, None)
                }
                Ok(Err(CompletionError::CouldNotComplete)) => {
                    println!("###### DONE {} ({i}/{max_idx}) ######", get_name(&element));
                    println!("#### Could not complete ####");
                    (vec![], None)
                }
                Ok(Err(CompletionError::Socket(e))) => {
                    eprintln!("Error while running strategy: {e}");
                    // don't send the engine back to the channel, these errors are typically
                    // irrecoverable
                    send_back = false;
                    (vec![], Some(e.to_string()))
                }
                Ok(Err(e)) => {
                    eprintln!("Error while running strategy: {e}");
                    (vec![], Some(e.to_string()))
                }
                // Panic caught
                Err(e) => {
                    eprintln!("Panic while running strategy: {e}");

                    let endpoint = endpoints[e_i].clone();

                    // restore state by re-creating the engine
                    *mutex_engine.lock().await = eval.get_completion_engine(endpoint).await;

                    (vec![], Some(e.to_string()))
                }
            };

            // send the engine back to the channel
            if send_back {
                e_tx.send(engine_pair).await.unwrap();
            }

            // announce that this task is done
            done_tx.send(i).await.unwrap();

            TaskResult {
                comps,
                maybe_error,
                maybe_arc_stats,
                element,
            }
        })
    }

    pub async fn run(mut self) {
        let max_idx = self.dataset.len() - 1;

        // we use a hashmap because we need to gradually remove elements from it,
        // keeping the indices in order
        let mut handles: HashMap<usize, JoinHandle<TaskResult>> = HashMap::new();

        for (i, element) in self.dataset.iter().enumerate() {
            // if the element exists in the results, skip it
            if self.results.iter().any(|r| &r.dataset_elem == element) {
                continue;
            }

            handles.insert(i, self.spawn_eval_task(element.to_owned(), i, max_idx));
        }

        while !handles.is_empty() {
            let done_i = self.done_rx.recv().await.unwrap();
            let handle = handles.remove(&done_i).unwrap();

            let TaskResult {
                comps,
                maybe_error,
                maybe_arc_stats,
                element,
            } = handle.await.unwrap();

            // get inner stats from the Arc Mutex
            let maybe_stats = match maybe_arc_stats {
                Some(arc_stats) => {
                    let stats = arc_stats.lock().await.clone();
                    Some(stats)
                }
                None => None,
            };

            let elem = ResultElement {
                dataset_elem: element.clone(),
                failed_message: maybe_error,
                eval_spec: self.eval.clone(),
                stats: maybe_stats,
                completions: comps,
            };

            self.results.push(elem);

            // rewrite results. i know, inefficient. whatever.
            write_results(&self.results, &self.eval.results_path).await;
        }
    }
}
