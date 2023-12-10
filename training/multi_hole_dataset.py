import datasets
from fim import permute_multi_holes
import numpy as np

base_ds = datasets.load_dataset("nuprl/ts-training", split="train")
rng = np.random.default_rng(42)

