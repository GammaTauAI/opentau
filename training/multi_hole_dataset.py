import datasets
from fim import permute_multi_holes
import os
import numpy as np

base_ds = datasets.load_dataset("nuprl/ts-training", split="train", revision="v1.1p1")
threads = os.cpu_count()
assert threads is not None
rng_ptrs = [np.random.default_rng(42) for _ in range(threads)]
max_holes = 6
min_holes = 1

def process(ex, idx):
    # get the id of this thread runnign in dataset.map
    thread_id = idx % threads
    rng = rng_ptrs[thread_id]
    num_holes = rng.integers(min_holes, max_holes + 1)
    content = ex["content"]
    new, new_rng = permute_multi_holes(content, rng, num_holes)
    rng_ptrs[thread_id] = new_rng
    ex["content"] = new
    return {"original_content": content,  **ex}

ds = base_ds.map(process, with_indices=True, num_proc=threads).filter(lambda x: x["content"] != None)
ds.push_to_hub("nuprl/ts-multi-hole-training")
