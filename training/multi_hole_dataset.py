import datasets
from fim import permute_multi_holes
import os
import numpy as np

base_ds = datasets.load_dataset("nuprl/ts-training", split="train", revision="v1.1p1")
rng = np.random.default_rng(42)
max_holes = 6
min_holes = 1

def process(ex):
    num_holes = rng.integers(min_holes, max_holes + 1)
    content = ex["content"]
    new = permute_multi_holes(content, rng, num_holes)
    ex["content"] = new
    return {"original_content": content,  **ex}

ds = base_ds.map(process)
ds.push_to_hub("nuprl/ts-multi-hole-training")
