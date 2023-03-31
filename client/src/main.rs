use std::{str::FromStr, sync::Arc};

use clap::Parser;
use opentau::{
    cache::Cache,
    completion::Completion,
    langserver::AnnotateType,
    main_strategies::{MainCtx, MainStrategy},
};
use tokio::sync::Mutex;

#[tokio::main]
async fn main() {
    let args = opentau::args::Args::parse();

    let lang_client = args.lang_client_factory().await;
    let strategy = args.stategy_factory();

    let file_contents = tokio::fs::read_to_string(&args.file).await.unwrap();

    let cache: Option<Arc<Mutex<Cache>>> = args.cache.as_ref().map(|u| {
        Arc::new(Mutex::new(Cache::new(u, args.stop_at).unwrap_or_else(
            |e| {
                eprintln!("Failed to connect to redis: {e}");
                std::process::exit(1);
            },
        )))
    });

    let types_to_annot = match args.exclude {
        None => AnnotateType::all(),
        Some(ref exclude) => {
            let commasplit = exclude.split(',');
            let mut exclude_types = Vec::new();
            for s in commasplit {
                let ex_type: AnnotateType = AnnotateType::from_str(s)
                    .unwrap_or_else(|_| panic!("Unknown type to exclude: {s}"));
                exclude_types.push(ex_type);
            }
            AnnotateType::all_except(&exclude_types)
        }
    };

    let ctx = MainCtx {
        file_contents,
        engine: args.completion_engine_factory(lang_client, cache).await,
        num_comps: args.n,
        retries: args.retries,
        fallback: args.fallback,
        stop_at: args.stop_at,
        enable_type_check: !args.disable_type_check,
        enable_defgen: args.enable_defgen,
        depth_limit: args.depth_limit,
        enable_usages: !args.disable_usages,
        types: types_to_annot,
    };

    // the typechecked and completed code(s). here if we get errors we exit with 1
    let good_ones: Vec<Completion> = match strategy.run(ctx).await {
        Ok(good_ones) => good_ones,
        Err(e) => {
            eprintln!("Fatal error while running strategy: {e}");
            std::process::exit(1);
        }
    };

    if good_ones.is_empty() {
        eprintln!("No completions type checked");
        std::process::exit(1);
    }

    println!("Number of good completions: {}", good_ones.len());

    // if the completed dir does not exist, create it
    let output_dir = std::path::Path::new(&args.output);
    if !output_dir.exists() {
        tokio::fs::create_dir_all(output_dir).await.unwrap();
    }

    // write to the output dir
    for (i, comp) in good_ones.into_iter().enumerate() {
        let fallback = if comp.fallbacked { "_fallback" } else { "" };
        let output_path = format!(
            "{}/{}_score_{}{}.{}",
            args.output, i, comp.score, fallback, args.lang
        );
        tokio::fs::write(&output_path, comp.code).await.unwrap();
    }
}
