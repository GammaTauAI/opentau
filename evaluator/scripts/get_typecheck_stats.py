from utils import read_jsonl


def get_num_typecheck(data_path):
    num_elems = 0
    num_elems_with_completion = 0
    num_typecheck = 0
    avg_errors = 0
    avg_heuristic = 0
    num_panic = 0
    for i, elem in enumerate(read_jsonl(data_path)):
        num_elems += 1
        # check if failed_message is not null
        if elem["failed_message"] is not None:
            num_panic += 1
            print(f"WARNING: Element at line {i+1} panicked. Message:")
            print(elem["failed_message"])
            continue

        # the first completion is always the best one
        if len(elem["completions"]) == 0:
            print(f"WARNING: Element at line {i+1} has no completions. Skipping.")
            continue

        num_elems_with_completion += 1
        comp = elem["completions"][0]
        num_errors = comp["num_type_errors"]
        if num_errors == 0:
            num_typecheck += 1
            avg_heuristic += comp["score"]

        avg_errors += num_errors

    avg_heuristic /= max(num_typecheck, 1)
    avg_errors /= max(num_elems_with_completion, 1)

    print("Number of elements: {}".format(num_elems))
    print("Number of elements with a completion: {}".format(num_elems_with_completion))
    print("Number of elements with a completion that typechecks: {}".format(num_typecheck))
    print("Number of elements that panicked: {}".format(num_panic))
    print("Average best number of errors: {}".format(avg_errors))
    print("Average best heuristic of ones that typecheck (lower is better): {}".format(
        avg_heuristic))


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("data_path", type=str, help="Path to data")
    args = parser.parse_args()

    get_num_typecheck(args.data_path)
