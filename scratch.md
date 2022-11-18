## Report

The InCoder model query system was implemented as a simple HTTP server that evaluates the InCoder model $M$ and receives an untyped input and several hyperparameters from the language server and returns a list of `type infills`. Then, the `type infills` are inserted into the original untyped code to yield the final completion. The pipeline is shown below:

Given the following prompt $\mathcal{P}$: we have the untyped `input`
```ts
function hello(name: _hole_): _hole_ {
  let msg: string = "Hello";
  return msg + ", " + name + "!";
}
```
and the hyperparameters `max_to_generate=5`, `temperature=0.8`, and `max_retries=1` in a POST request, the server will split the `input` by the fake type, `_hole_` to yield the following list:

```ts
parts_list = ["function hello(name: ",
         "): ",
         " { let msg: string = \"Hello\"; return msg + \", \" + name + \"!\";}"
]
```
The `parts_list` and the given hyperparameters will form prompt $\mathcal{P}$' and will be given to $M$ for the `infill` task. $M$($\mathcal{P}$') will yield a list of inferred types, such as
```ts
type_list = ["string", "string"]
```
Then, the `type_list` will be inserted into the original `parts_list` to build the final completion:
```ts
function hello(name: string): string {
  let msg: string = "Hello";
  return msg + ", " + name + "!";
}
```
The describes process will execute $N$ number of times where $N$ is the number of requested completions.
Finally, the InCoder server will return the following JSON response:
```json
{
  "choices": [
    "text": <completion0>
    "text": <completion1>
    ...
    "text": <completionN>
  ]
}
```
where `choices` is of length $N$.

In production, we execute the InCoder model on 1 A100 GPU from Northeastern's Discovery Cluster while the rest of the pipeline is computed with CPU power.

\newpage

## Reflect

#### Initial Progress Goals

_"By now, we will have implemented type-inference for Python and a prompt engineering approach that will allow us to type-infer larger files."_

#### Current Achievements

While we were initially planning to implement Python type-inference for milestone 2, we decided to focus on the InCoder completion implementation as it would allow us to have access to an infinite number of calls to the model without reaching certain rate limitations. However, after we briefly tested the InCoder server, we observed a trade-off between the effectiveness of the Codex model and the speed of the InCoder model. So far, the Codex model has shown a strong performance in the type-inference task, but the model can only be queried up to 20x per minute per API key. On the other hand, the InCoder model can be evaluated several times in less than a second without reaching a rate limitation, but the respective completions have proven to be significantly less accurate than the Codex model. In particular, the InCoder model struggles with the case of inferring a single type where appropriate while being given a max token length hyperparameter greater than 1. For example:

Given the following untyped input,
```ts
function hello(name: _hole_): _hole_ {
  let msg: string = "Hello";
  return msg + ", " + name + "!";
}
```
the correct types should be `string` and `string`. However, given a max token length hyperparameter of 5, the model may return the following typed completion,
```ts
function hello(name: stringstring): stringstringstring {
  let msg: string = "Hello";
  return msg + ", " + name + "!";
}
```
Clearly, the model is trying to infill `string` but is unable to effectively determine the appropriate length of the type infill. It is important to note that the hyperparameter for max token length must be greater than 1 to accomodate the possibility of larger type-infills, such as `Union[str, int]` or `LargeCustomTypeLongName`.

## Replan

#### Plan Moving Forward
To address the max token hyperparameter problem, we plan to run a benchmark test for several temperature hyperparameters to find a list of the most optimal temperatures for the general `type infill` task. Then, we will update the InCoder server implementation to return a list of completions that were generated with varying temperatures. In addition, we plan to implement type-inference for Python using the same completion pipeline that is used for TypeScript. Then, we plan to formally benchmark our TypeScript and Python type-inference across a randomly selected 100-file subset of Leetcode solutions. The accuracy will be reported as the proportion of files that type-checked over the total number of files attempted (100).

#### Timeline

- **12/13:**
  - Python type-inference
  - Benchmarking for accuracy across a 100-file dataset

\newpage
