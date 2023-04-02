import json


def read_jsonl(path):
    with open(path, 'r') as f:
        for line in f:
            yield json.loads(line)
