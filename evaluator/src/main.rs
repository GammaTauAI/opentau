use evaluator::{
    append_result, check_file_delete, read_dataset, write_results, EvalSpec, ResultElement,
};
use opentau::completion::TypecheckedCompletion;

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
    let max_idx = dataset.len() - 1;
    let maybe_resume = check_file_delete(&eval.results_path).await;
    if let Some(resume) = maybe_resume {
        results = resume;
        println!("Resuming from {} results", results.len());
    }

    for (i, element) in dataset.into_iter().enumerate() {
        if i < results.len() {
            // already done from previous run
            continue;
        }
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
        let comps = strategy.run(context).await;
        let elem = match comps {
            Ok(comps) => {
                // put the ones with num_type_errors == 0 first
                let mut zero_err_comps: Vec<TypecheckedCompletion> = Vec::new();
                let mut non_zero_err_comps: Vec<TypecheckedCompletion> = Vec::new();
                for comp in comps {
                    if comp.num_type_errors == 0 {
                        zero_err_comps.push(comp);
                    } else {
                        non_zero_err_comps.push(comp);
                    }
                }

                let mut res_comps = zero_err_comps;
                res_comps.append(&mut non_zero_err_comps);

                ResultElement {
                    dataset_elem: element,
                    failed_message: None,
                    eval_spec: Some(eval.clone()),
                    completions: res_comps,
                }
            }
            Err(e) => {
                eprintln!("Error while running strategy: {e}");
                ResultElement {
                    dataset_elem: element,
                    failed_message: Some(e.to_string()),
                    eval_spec: Some(eval.clone()),
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
