use evaluator::{
    append_result, check_file_delete, read_dataset, write_results, EvalSpec, ResultElement,
};
use opentau::completion::sort_completions;

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

    let mut engines = vec![];
    for endpoint in endpoints.iter() {
        let engine = eval.get_completion_engine(endpoint.to_string()).await;
        engines.push(engine.clone());
    }

    for (c_i, chunk) in dataset.chunks(endpoints.len()).enumerate() {
        let mut tasks_results = Vec::new();

        for (e_i, element) in chunk.iter().enumerate() {
            // calculate real index
            let i = c_i * endpoints.len() + e_i;

            if i < results.len() {
                // already done from previous run
                continue;
            }

            let engine = engines[e_i].clone();

            println!(
                "###### RUNNING {} ({i}/{max_idx}) ######",
                element["hexsha"]
                    .as_str()
                    .unwrap_or_else(|| element["name"].as_str().unwrap()),
            );

            let content = element["content_without_annotations"]
                .as_str()
                .unwrap_or_else(|| element["content"].as_str().unwrap());
            let context = eval.make_main_ctx(content.to_string(), engine.clone());
            let (strategy, maybe_arc_stats) = eval.get_strategy();

            // wrap in a task so that we can catch panics
            let task = tokio::task::spawn(async move { strategy.run(context).await });
            tasks_results.push((e_i, maybe_arc_stats, element.clone(), task));
        }

        for (e_i, maybe_arc_stats, element, handle) in tasks_results {
            // get inner stats from the Arc Mutex
            let stats_unarc = match maybe_arc_stats {
                Some(arc_stats) => {
                    let stats = arc_stats.lock().await.clone();
                    Some(stats)
                }
                None => None,
            };

            let (comps, maybe_error) = match handle.await {
                Ok(Ok(mut comps)) => {
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
                Ok(Err(e)) => {
                    eprintln!("Error while running strategy: {e}");
                    (vec![], Some(e.to_string()))
                }
                // Panic caught
                Err(e) => {
                    eprintln!("Panic while running strategy: {e}");

                    // restore state by re-creating the engine
                    engines[e_i] = eval.get_completion_engine(endpoints[e_i].to_string()).await;

                    (vec![], Some(e.to_string()))
                }
            };

            let elem = ResultElement {
                dataset_elem: element.clone(),
                failed_message: maybe_error,
                eval_spec: eval.clone(),
                stats: stats_unarc,
                completions: comps,
            };

            append_result(&elem, &eval.results_path).await;
            results.push(elem);
        }
    }

    // rewrite results, just in case
    write_results(&results, &eval.results_path).await;
}
