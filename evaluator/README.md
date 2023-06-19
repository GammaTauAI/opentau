# OpenTau Evaluator

This is a tool to evaluate the performance of OpenTau.
Takes in a cfg file, example at `./cfgs/santacoder_tiny.json`.
The results are written to the output path specified in the cfg file.

### Running the Evaluator

To run the evaluator, Cargo must be installed on the system.
Then, a configuration file must be created. More information on the configuration file options
can be found in the doc comments of the `EvalSpec` struct in `./src/lib.rs`.
Sample configuration files can be found in `./cfgs/`. To run these sample configuration files,
the `local_model_socket` field must be changed to point to the location of the currently running
SantaCoder server socket(s).

Once a configuration file is created, the evaluator can be run with the following command:

```bash
cargo run --release -- <path_to_cfg_file>
```

The evaluator will print the status of the evaluation to stdout. When ran in debug mode, the evaluator
will also print debug information to stdout. When the evaluation is complete, the evaluator will write
the results to the output path specified in the cfg file. It is possible to resume a stopped evaluation by
re-running the evaluator with the same cfg file when a results file already exists at the output path.

#### Changing the Context Window Size

It is not possible to change the maximum context window size from the evaluator. To change the maximum
context window size, the SantaCoder server must be restarted with the `--max_length <size>` flag set
to the desired size.

### Results Presented in Table 3

The results presented in Table 3 of the paper can be found in the `./results/` directory.
The results reside in a separate submodule, thus the submodule must be initialized before the results
can be accessed.

The `./results` directory contains a separate README file with more information about the results,
including which file corresponds to which configuration.

### Results Metrics Script

A python script located at `./scripts/get_typecheck_stats.py` can be utilized to extract the results from the output file.
For example, to extract the results from the output file `./output/santacoder_tiny.json`, run the following command:

```bash
python3 ./scripts/get_typecheck_stats.py ./results/santacoder_tiny.json
```

Additionally, to retrieve syntax error metrics, the `--syntax` flag can be used:

```bash
python3 ./scripts/get_typecheck_stats.py ./results/santacoder_tiny.json --syntax
```

### Visualizing the Results

We have created a very simple html page to visualize the result files. This page is
located at `./visualizer/index.html`. To use this page, simply open it in a browser
and select the result file to visualize.
