from utils import read_jsonl


def get_num_typecheck(data_path):
    num_elems = 0
    num_typecheck = 0
    num_dont_typecheck = 0
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

        comp = elem["completions"][0]
        num_errors = comp["num_type_errors"]
        if num_errors == 0:
            num_typecheck += 1
            avg_heuristic += comp["score"]
        else:
            num_dont_typecheck += 1
            avg_errors += num_errors

    avg_heuristic /= max(num_typecheck, 1)
    avg_errors /= max(num_dont_typecheck, 1)

    print("Number of elements: {}".format(num_elems))
    print("Number of elements with a completion that typechecks: {}".format(num_typecheck))
    print("Number of elements with a completion that doesn't typecheck: {}".format(num_dont_typecheck))
    print("Number of elements that panicked: {}".format(num_panic))
    print("Average best number of errors in the ones that don't typecheck: {}".format(avg_errors))
    print("Average best heuristic of ones that typecheck (lower is better): {}".format(
        avg_heuristic))


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("data_path", type=str, help="Path to data")
    args = parser.parse_args()

    get_num_typecheck(args.data_path)
