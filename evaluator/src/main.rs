use evaluator::{read_dataset, write_results, EvalSpec, ResultCompletion, ResultElement, append_result};

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

    let engine = eval.get_completion_engine().await;
    let strategy = eval.get_strategy();

    let mut results: Vec<ResultElement> = Vec::new();
    for element in dataset {
        let context =
            eval.make_main_ctx(element.content_without_annotations.clone(), engine.clone());
        let comps = strategy.run(context).await;
        let elem = match comps {
            Ok(comps) => {
                // hack, but whatever
                let mut context =
                    eval.make_main_ctx(element.content_without_annotations.clone(), engine.clone());
                context.enable_type_check = true;

                let typechecked = context.type_check_candidates(comps.clone()).await;

                // get a diff of the ones that don't typecheck
                let dont_typecheck = comps
                    .into_iter()
                    .filter(|c| !typechecked.contains(c))
                    .collect::<Vec<_>>();

                let mut res_comps = Vec::new();
                for comp in typechecked {
                    res_comps.push(ResultCompletion {
                        completion: comp.code,
                        does_typecheck: true,
                        heuristic: comp.score,
                    });
                }
                for comp in dont_typecheck {
                    res_comps.push(ResultCompletion {
                        completion: comp.code,
                        does_typecheck: false,
                        heuristic: comp.score,
                    });
                }

                ResultElement {
                    dataset_elem: element,
                    failed_message: None,
                    completions: res_comps,
                }
            }
            Err(e) => {
                eprintln!("Error while running strategy: {e}");
                ResultElement {
                    dataset_elem: element,
                    failed_message: Some(e.to_string()),
                    completions: vec![],
                }
            }
        };

        append_result(&elem, &eval.results_path).await;
        results.push(elem);
    }

    // rewrite results, just in case
    write_results(&results, &eval.results_path).await;
}
