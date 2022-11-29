"""adapted from dpfried/incoder/example_usage.py"""

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

from utils import input_to_infill_format

from typing import List


MODEL_MAX_OUTPUT_LENGTH = 2048

# set BIG_MODEL to use the 6.7B parameter model
BIG_MODEL = False

# use a GPU
CUDA = torch.cuda.is_available()

# infill max length allowed
MAX_TO_GENERATE = 5

BOS = "<|endoftext|>"
EOM = "<|endofmask|>"

if BIG_MODEL:
    model_name = "facebook/incoder-6B"

    # the arguments added below will load a half precision version of the model,
    # which requires less RAM than loading the full float32 version.  this 
    # should fit in ~16GB of RAM
    # NOTE: half precision should *not* be used if you plan to fine-tune the
    # model. You'll need full precision and a lot of GPU memory. We have not
    # tested fine-tuning in `transformers` (the model was trained in fairseq)
    if CUDA:
        kwargs = dict(
            revision="float16", 
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True,
        )
    else:
        kwargs = dict(
            low_cpu_mem_usage=True,
        )
else:
    model_name = "facebook/incoder-1B"
    kwargs = {}

model = AutoModelForCausalLM.from_pretrained(model_name, **kwargs)
tokenizer = AutoTokenizer.from_pretrained(model_name)

if CUDA:
    # if you plan to fine-tune the model, you should not use half precision.
    model = model.half().cuda()


def generate(input: str, max_to_generate: int=128, temperature: float=0.2):
    """
    Do standard left-to-right completion of the prefix `input` by sampling from the model
    """
    input_ids = tokenizer(input, return_tensors="pt").input_ids
    if CUDA:
        input_ids = input_ids.cuda()
    max_length = max_to_generate + input_ids.flatten().size(0)
    if max_length > 2048:
        print("warning: max_length {} is greater than the context window {}".format(max_length, 2048))
    with torch.no_grad():
        output = model.generate(input_ids=input_ids, do_sample=True, top_p=0.95, temperature=temperature, max_length=max_length)
    # pass clean_up_tokenization_spaces=False to avoid removing spaces before punctuation, e.g. "from ." -> "from."
    detok_hypo_str = tokenizer.decode(output.flatten(), clean_up_tokenization_spaces=False)
    if detok_hypo_str.startswith(BOS):
        detok_hypo_str = detok_hypo_str[len(BOS):]
    return detok_hypo_str

def _prefix_ending_with_newline(str, max_length):
    """
    Produces a prefix of str is at most max_length, but does not split a line.
    """
    return str[:max_length].rsplit("\n", 1)[0]

def _suffix_starting_with_newline(str, max_length):
    """
    Produces a suffix of str is at most max_length, but does not split a line.
    """
    return str[-max_length:].split("\n", 1)[0]

def _clip_text(str1, str2, max_length):
    """
    Clips the two strings so that the total length is at most max_length.
    Keeps the first string intact, and clips the second string if possible
    """

    # Find the last occurrence of "function" in str1
    enclosing_function_start = str1.rfind("function")
    str1 = str1[enclosing_function_start:]

    if len(str1) < max_length:
        str2 = _prefix_ending_with_newline(str2, max_length - len(str1))
    elif len(str2) < max_length:
        # Negative, so we get the suffix
        str1 = _suffix_starting_with_newline(str1, max_length - len(str2))
    else:
        # Both exceed the max_length
        str1 = _suffix_starting_with_newline(str1, max_length // 2)
        str2 = _prefix_ending_with_newline(str2, max_length // 2)
    return str1, str2

def _generate(prompt: str, temperature: float, type_length_limit: int) -> str:
    """
    A canonical function to generate text from a prompt. The length_limit
    limits the maximum length of the generated text (beyond the prompt).
    """
    input_ids = tokenizer(prompt, return_tensors="pt").input_ids.to(
        model.device
    )
    current_length = input_ids.flatten().size(0)
    max_length = type_length_limit + current_length
    if max_length > MODEL_MAX_OUTPUT_LENGTH:
        max_length = MODEL_MAX_OUTPUT_LENGTH

    do_sample = False if temperature == 0 else True

    output = model.generate(
        input_ids=input_ids,
        do_sample=do_sample,
        top_p=0.95,
        temperature=temperature,
        max_length=max_length,
    )
    detok_hypo_str = tokenizer.decode(output.flatten())
    if detok_hypo_str.startswith(BOS):
        detok_hypo_str = detok_hypo_str[len(BOS) :]
    return detok_hypo_str

def infill(
        input: str,
        temperature: float = 0.0,
        type_length_limit: int = 5,
        max_context_length: int = 70
    ) -> str:
    parts: List[str] = input_to_infill_format(input)
    infilled_prefix = parts[0]
    for part_index, part in enumerate(parts[1:]):
        suffix = "".join(parts[part_index + 1 :])
        prompt = f"{infilled_prefix}<|mask:0|>{suffix}<|mask:1|><|mask:0|>"
        filled_type = _generate(prompt, temperature, type_length_limit)
        print(f'{part_index}: {filled_type}')
        infilled_prefix += filled_type + part
    return infilled_prefix

# def infill(
        # input: str,
        # temperature: float = 0.0,
        # type_length_limit: int = 5,
        # max_context_length: int = 70
    # ) -> str:
    # parts: List[str] = input_to_infill_format(input)
    # infilled_prefix = parts[0]
    # for part_index, part in enumerate(parts[1:]):
        # suffix = "".join(parts[part_index + 1 :])
        # clipped_prefix, clipped_suffix = _clip_text(
            # infilled_prefix, suffix, max_context_length
        # )
        # prompt = f"{clipped_prefix}: <|mask:0|>{clipped_suffix}<|mask:1|><|mask:0|>"
        # print(f'{part_index}: {prompt}')
        # filled_type = _generate(prompt, temperature, type_length_limit)
        # infilled_prefix += ": " + filled_type + part
    # print(f'here: {infilled_prefix}')
    # return infilled_prefix
