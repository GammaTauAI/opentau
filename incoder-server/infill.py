"""adapted from dpfried/incoder/example_usage.py"""

from typing import List
from utils import input_to_infill_format, compose_response

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

# set BIG_MODEL to use the 6.7B parameter model
BIG_MODEL = False

# use a GPU
CUDA = torch.cuda.is_available()

# infill max length allowed
MAX_TO_GENERATE = 1

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

# signals the start of a document
BOS = "<|endoftext|>"
# signals the end of a generated infill
EOM = "<|endofmask|>"

def make_sentinel(i):
    # signals (1) a location to insert an infill and (2) the start of the infill generation
    return f"<|mask:{i}|>"

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

def _infill(parts: List[str], max_to_generate: int, temperature: float, max_retries: int=1, extra_sentinel: bool=True):
    """
    Generate infills to complete a partial document, e.g.
    [A C E] -> [A B C D E], where B and D are infills that have been generated.

    parts: List[str]. list of parts of the document. One string will be
            inserted in between each element, i.e. infilling N-1 locations for a list
            of length N.
    max_to_generate: int. maximum number of tokens to generate. Keep in mind
            that the model context size is 2048.
    temperature: float. temperature parameter for sampling.
    extra_sentinel: bool. we recommend setting this to True, as it makes it
            easier for the model to end generated infills. See the footnote in 
            section 2.2 of our paper for details.
    max_retries: int. if > 1, use rejection sampling to keep sampling infills until
            all infills sample a completion token.

    returns a dictionary containing the following:
        text:  str, the completed document (with infills inserted)
        parts:  List[str], length N. Same as passed to the method
        infills:  List[str], length N-1. The list of infills generated
        retries_attempted:  number of retries used (if max_retries > 1)
    """
    assert isinstance(parts, list)
    retries_attempted = 0
    done = False
    text = ''
    infills = []

    while (not done) and (retries_attempted < max_retries):
        retries_attempted += 1

        ## (1) build the prompt
        if len(parts) == 1:
            prompt = parts[0]
        else:
            prompt = ""
            # encode parts separated by sentinel
            for sentinel_ix, part in enumerate(parts):
                prompt += part
                if extra_sentinel or (sentinel_ix < len(parts) - 1):
                    prompt += make_sentinel(sentinel_ix)
        
        infills = []
        complete = []

        done = True

        ## (2) generate infills
        for sentinel_ix, part in enumerate(parts[:-1]):
            complete.append(part)
            prompt += make_sentinel(sentinel_ix)
            # TODO: this is inefficient as it requires re-encoding prefixes repeatedly
            completion = generate(prompt, max_to_generate, temperature)
            completion = completion[len(prompt):]
            if EOM not in completion:
                completion += EOM
                done = False
            completion = completion[:completion.index(EOM) + len(EOM)]
            infilled = completion[:-len(EOM)]
            infills.append(infilled)
            complete.append(infilled)
            prompt += completion
        complete.append(parts[-1])
        text = ''.join(complete)

    return {
        'text': text, # str, the completed document (with infills inserted)
        'parts': parts, # List[str], length N. Same as passed to the method
        'infills': infills, # List[str], length N-1. The list of infills generated
        'retries_attempted': retries_attempted, # number of retries used (if max_retries > 1)
    } 

def infill(input: str, n: int = 1, temperature: float = 1.0) -> List[str]:
    res = [_infill(
        parts=input_to_infill_format(input),
        max_to_generate=MAX_TO_GENERATE,
        temperature=temperature,
    ) for _ in range(n)]
    return [compose_response(s) for s in res]
