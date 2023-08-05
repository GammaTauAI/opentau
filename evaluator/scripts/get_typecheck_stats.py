from utils import read_jsonl


def get_syntax_errors(code):
    try:
        # run the ts-node program in this directory, the exit code
        # is the number of errors. the input is given by stdin
        import subprocess
        import os

        projdir = os.path.join(os.path.dirname(__file__), "ts-does-parse")
        # if node_modules doesn't exist, run npm install
        if not os.path.exists(os.path.join(projdir, "node_modules")):
            print("Running npm install...")
            proc = subprocess.Popen(
                ["npm", "install"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=projdir,
            )
            _ = proc.communicate()
            if proc.returncode != 0:
                print("Failed to run npm install. Exiting.")
                return 0

        proc = subprocess.Popen(
            ["npm", "start"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=projdir,
        )
        _ = proc.communicate(input=code.encode("utf-8"))
        return proc.returncode
    except Exception as e:
        print("Had an error running the syntax checker: {}".format(e))
        return 0


def get_num_typecheck(data_path, run_syntax):
    num_elems = 0
    num_elems_with_completion = 0
    num_typecheck = 0
    avg_type_errors = 0
    avg_syntax_errors = 0
    avg_heuristic = 0
    total_num_any_in_typechecks = 0
    num_panic = 0
    for i, elem in enumerate(read_jsonl(data_path)):
        print(f"{i}...", end="", flush=True)
        num_elems += 1
        # check if failed_message is not null
        if elem["failed_message"] is not None:
            num_panic += 1
            print(f"WARNING: Element at line {i+1} panicked. Message:")
            print(elem["failed_message"])
            continue

        # the first completion is always the best one
        if len(elem["completions"]) == 0:
            print(
                f"WARNING: Element at line {i+1} has no completions. Skipping.")
            continue

        num_elems_with_completion += 1
        comp = elem["completions"][0]
        num_errors = comp["num_type_errors"]
        if num_errors == 0:
            num_typecheck += 1
            avg_heuristic += comp["score"]
            total_num_any_in_typechecks += comp["code"].count(": any")

        avg_type_errors += num_errors
        if run_syntax:
            avg_syntax_errors += get_syntax_errors(comp["code"])

    avg_heuristic /= max(num_typecheck, 1)
    avg_type_errors /= max(num_elems_with_completion, 1)
    avg_syntax_errors /= max(num_elems_with_completion, 1)

    print()
    print("Number of elements: {}".format(num_elems))
    print("Number of elements with a completion: {}".format(
        num_elems_with_completion))
    print("Number of elements with a completion that typechecks: {}".format(num_typecheck))
    print("Number of elements that panicked: {}".format(num_panic))
    print("Average best number of type errors: {}".format(avg_type_errors))
    if run_syntax:
        print("Average best number of syntax errors: {}".format(avg_syntax_errors))
    print("Average best heuristic of ones that typecheck (lower is better): {}".format(
        avg_heuristic))
    print("Average number of anys per completion that typechecks: {}".format(
        total_num_any_in_typechecks / max(num_typecheck, 1)))


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("data_path", type=str, help="Path to data")
    parser.add_argument("--syntax", action="store_true",
                        help="Run the syntax checker")
    args = parser.parse_args()

    get_num_typecheck(args.data_path, args.syntax)
