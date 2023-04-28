use std::sync::Arc;

use evaluator::{
    append_result, check_file_delete, read_dataset, write_results, EvalSpec, ResultElement,
};
use opentau::completion::{sort_completions, ArcCompletionEngine, CompletionError};
use tokio::sync::Mutex;

fn get_content(element: &serde_json::Value) -> String {
    element["content_without_annotations"]
        .as_str()
        .unwrap_or_else(|| element["content"].as_str().unwrap())
        .to_string()
}

fn get_name(element: &serde_json::Value) -> String {
    element["hexsha"]
        .as_str()
        .unwrap_or_else(|| element["name"].as_str().unwrap())
        .to_string()
}

#[tokio::main]
async fn main() {
    let args = std::env::args().collect::<Vec<_>>();
    if args.len() < 2 {
        eprintln!("Usage: {} <eval file>", args[0]);
        std::process::exit(1);
    }

    let eval: EvalSpec = serde_json::from_str(
        &tokio::fs::read_to_string(&args[1])
            .await
            .unwrap_or_else(|_| {
                eprintln!("Failed to read eval file");
                std::process::exit(1);
            }),
    )
    .unwrap_or_else(|_| {
        eprintln!("Failed to parse eval file");
        std::process::exit(1);
    });

    let dataset = read_dataset(&eval.dataset_path).await;
    println!("Read {} input files", dataset.len());

    let mut results: Vec<ResultElement> = Vec::new();
    let max_idx = dataset.len() - 1;

    let maybe_resume = check_file_delete(&eval.results_path).await;
    if let Some(resume) = maybe_resume {
        results = resume;
        println!("Resuming from {} results", results.len());
    }

    let endpoints = match eval.local_model_socket {
        Some(ref sockets) => sockets.split(',').map(|s| s.to_string()).collect(),
        None => vec![eval.remote_model_key.as_ref().unwrap().to_string()],
    };
    assert!(!endpoints.is_empty());

    type MutexEngine = Arc<Mutex<ArcCompletionEngine>>;
    let (e_tx, e_rx): (tokio::sync::mpsc::Sender<(usize, MutexEngine)>, _) =
        tokio::sync::mpsc::channel(endpoints.len());
    let e_rx = Arc::new(Mutex::new(e_rx));

    for (e_i, endpoint) in endpoints.iter().enumerate() {
        let engine = eval.get_completion_engine(endpoint.to_string()).await;
        let mutex_engine = Arc::new(Mutex::new(engine.clone()));
        e_tx.send((e_i, mutex_engine)).await.unwrap();
    }

    let mut handles = Vec::new();

    for (i, element) in dataset.into_iter().enumerate() {
        // if the element exists in the results, skip it
        if results.iter().any(|r| r.dataset_elem == element) {
            continue;
        }

        // a good healthy dose of cloning
        let e_tx = e_tx.clone();
        let e_rx = e_rx.clone();
        let eval = eval.clone();
        let endpoints = endpoints.clone();

        let outer_task = tokio::task::spawn(async move {
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
            e_tx.send(engine_pair).await.unwrap();

            (comps, maybe_error, maybe_arc_stats, element)
        });
        handles.push(outer_task);
    }

    for handle in handles {
        let (comps, maybe_error, maybe_arc_stats, element) = handle.await.unwrap();
        // get inner stats from the Arc Mutex
        let stats_unarc = match maybe_arc_stats {
            Some(arc_stats) => {
                let stats = arc_stats.lock().await.clone();
                Some(stats)
            }
            None => None,
        };

        let elem = ResultElement {
            dataset_elem: element.clone(),
            failed_message: maybe_error,
            eval_spec: eval.clone(),
            stats: stats_unarc,
            completions: comps,
        };

        results.push(elem);

        // rewrite results. i know, inefficient. whatever.
        write_results(&results, &eval.results_path).await;
    }
}
