from utils import read_jsonl

def get_num_typecheck(data_path):
    num_elems = 0
    num_typecheck = 0
    avg_heuristic = 0
    for elem in read_jsonl(data_path):
        num_elems += 1
        for comp in elem["completions"]:
            if comp["does_typecheck"]:
                num_typecheck += 1
                avg_heuristic += comp["heuristic"]
                break

    avg_heuristic /= num_typecheck

    print("Number of elements: {}".format(num_elems))
    print("Number of elements that typecheck: {}".format(num_typecheck))
    print("Average heuristic (lower is better): {}".format(avg_heuristic))

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("data_path", type=str, help="Path to data")
    args = parser.parse_args()

    get_num_typecheck(args.data_path)
