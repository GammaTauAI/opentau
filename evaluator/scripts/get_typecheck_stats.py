from utils import read_jsonl
from tqdm import tqdm
import re


def start_node_proc(projdir):
    # run the ts-node program in this directory, the exit code
    import subprocess
    import os
    # is the number of errors. the input is given by stdin

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
            raise Exception("Failed to run npm install.")

    proc = subprocess.Popen(
        ["npm", "start", "--silent"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=projdir,
    )
    return proc


def get_syntax_errors(code):
    try:
        import os
        projdir = os.path.join(os.path.dirname(__file__), "ts-does-parse")
        proc = start_node_proc(projdir)
        _ = proc.communicate(input=code.encode("utf-8"))
        return proc.returncode
    except Exception as e:
        print("Had an error running the syntax checker: {}".format(e))
        return 0


def get_proportion_of_anys(code):
    try:
        import os
        projdir = os.path.join(os.path.dirname(
            __file__), "ts-proportion-of-anys")
        proc = start_node_proc(projdir)
        stdout, _ = proc.communicate(input=code.encode("utf-8"))
        decoded = stdout.decode("utf-8")
        # format is "annot,anys"
        annot, anys = decoded.split(",")
        return annot, anys
    except Exception as e:
        print("Had an error running the any finder: {}".format(e))
        return 0, 0


def get_num_typecheck(data_path, run_syntax, run_any_finder):
    num_elems = 0
    num_elems_with_completion = 0
    num_typecheck = 0
    avg_type_errors = 0
    avg_syntax_errors = 0
    avg_heuristic = 0
    total_num_any_in_typechecks = 0
    total_num_annot_in_typechecks = 0
    num_panic = 0
    for i, elem in tqdm(enumerate(read_jsonl(data_path))):
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

            if run_any_finder:
                annot, anys = get_proportion_of_anys(comp["code"])
                total_num_any_in_typechecks += int(anys)
                total_num_annot_in_typechecks += int(annot)

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
    print("Percentage of elements with a completion that typechecks: {}".format(
        num_typecheck / max(num_elems_with_completion, 1)))
    print("Number of elements that panicked: {}".format(num_panic))
    print("Average best number of type errors: {}".format(avg_type_errors))
    if run_syntax:
        print("Average best number of syntax errors: {}".format(avg_syntax_errors))
    print("Average best heuristic of ones that typecheck (lower is better): {}".format(
        avg_heuristic))
    if run_any_finder:
        print("Average number of anys per completion that typechecks: {}".format(
            total_num_any_in_typechecks / max(num_typecheck, 1)))
        print("Percentage of anys per annotation in completions that typechecks: {}".format(
            total_num_any_in_typechecks / max(total_num_annot_in_typechecks, 1)))


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("data_path", type=str, help="Path to data")
    parser.add_argument("--syntax", action="store_true",
                        help="Run the syntax checker")
    parser.add_argument("--any_finder", action="store_true",
                        help="Run the any finder")
    args = parser.parse_args()

    get_num_typecheck(args.data_path, args.syntax, args.any_finder)
