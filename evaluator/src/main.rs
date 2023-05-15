use evaluator::pue;
use evaluator::{read_dataset, runner::RunnerState, EvalSpec};

#[tokio::main]
async fn main() {
    let args = std::env::args().collect::<Vec<_>>();
    if args.len() < 2 {
        pue!();
    }

    let eval: EvalSpec = serde_json::from_str(
        &tokio::fs::read_to_string(&args[1])
            .await
            .unwrap_or_else(|_| pue!("Failed to read eval file")),
    )
    .unwrap_or_else(|_| {
        pue!("Failed to parse eval file");
    });

    let dataset = read_dataset(&eval.dataset_path).await;
    println!("Read {} input files", dataset.len());

    RunnerState::setup(eval, dataset).await.run().await;
}
