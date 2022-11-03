---
title: "Using OpenAI Codex for Gradual Type Inference"
subtitle: "Milestone I Report"
author: Federico Cassano, Noah Shinn
geometry: "left=3cm,right=3cm,top=3cm,bottom=3cm"
output: pdf_document
---

## Report

Our high-level approach to type-inference via Codex is the following:

- 1. We insert the identifier `_hole_` in the place of missing types in our input JavaScript program. To do this, we use a compiler $\mathcal{K} : \text{File} \rightarrow \mathcal{P}$.
- 2. We define an instruction $\mathcal{I}$, which is the constant string,  
     $\mathcal{I} = \text{"Substitute the identifier \_hole\_ with the correct type."}$
- 3. We query the `davinci-edit` model using the compiled prompt $\mathcal{P}$ and instruction $\mathcal{I}$, and we receive back a set of completions $\mathcal{C}$, $0 \leq |\mathcal{C}| \leq n$, where $n$ is a pre-defined maximum number of completions.
- 4. We use a cheap and admissible heuristic $h : c \rightarrow (\text{Boolean},\ \mathcal{N})$ that determines if a given completion $c$ is _correct_ (a _correct_ completion however may still not type-check) and the quality of the type annotations $q$, where lower the $q$ the better.
- 5. We apply $h$ to all elements in $\mathcal{C}$ and we add the completions that produced $\text{True}$ to an ordered set $\mathcal{Q}$, where $\mathcal{Q}$ is sorted by $q$.
- 6. Using the command: `tsc --allowJs --checkJs --noEmit --target es2022 <file.ts>` we run a full type-check on every completion in $\mathcal{Q}$, terminating as soon as the command returns code `0`, meaning that the completion is type-correct.

### Implementation of the Pipeline

#### Compiler

Firstly, in the development of this pipeline, we have implemented $\mathcal{K}$ by interfacing with the TypeScript compiler API for inserting type-holes into identifiers that lack type annotations.

For instance, given this input:

```ts
function hello(name: string) {
  let msg = "Hello";
  return msg + ", " + name + "!";
}
```

$\mathcal{K}$ will output the following:

```ts
function hello(name: string): _hole_ {
  let msg: _hole_ = "Hello";
  return msg + ", " + name + "!";
}
```

\newpage

#### Heuristic

Secondly, we have implemented our heuristic $h$, which is part of the compiler $\mathcal{K}$. The heuristic traverses the program's abstract syntax tree, identifies different types, which will be scored. Some types terminate the heuristic early, and denote that the program cannot possibly be correct. The scores are summed to compose $q$ using the following table:

| Type                                     | Score | Correct          |
| ---------------------------------------- | ----- | ---------------- |
| _missing_ (example: `let x = 1`)         | +0    | False, terminate |
| _literal type_ (example: `let x: 3 = 1`) | +0    | False, terminate |
| `_hole_`                                 | +0    | False, terminate |
| `unknown`                                | +10   | True, continue   |
| `any`                                    | +5    | True, continue   |
| `undefined`                              | +2    | True, continue   |
| `Function` (interface type)              | +5    | True, continue   |

For example, with the completion:

```ts
function hello(name: string): any {
  let msg: undefined = "Hello";
  return msg + ", " + name + "!";
}
```

$h$ will output $(\text{True}, 7)$, as the presence of one `any` and `undefined` gives a summed score of $5 + 2 = 7$

While, with the completion:

```ts
function hello(name: string): _hole_ {
  let msg: string = "Hello";
  return msg + ", " + name + "!";
}
```

$h$ will terminate early and output $(\text{False}, 0)$, as the presence of one `_hole_` type terminates the heuristic early.

Additionally, $h$ checks if Codex didn't add anything other than just types (such as additonal code blocks and comments) to the original prompt. If that condition isn't met, $(\text{False}, 0)$ will be produced.
\newpage

#### Client

Finally, we have implemented a client in Rust that manages the pipeline and queries the Codex API. The client will communicate with the compiler $K$, which is written in TypeScript, and will send the outputs to Codex. The client can be downloaded from [https://github.com/GammaTauAI/opentau](https://github.com/GammaTauAI/opentau), and can be utilized by using the following terminal interface:

```
USAGE:
    client [OPTIONS] --tokens <TOKENS> --file <FILE> --output <OUTPUT>

OPTIONS:
    -c, --cache <CACHE>          The Redis URL for the cache
        --disable-rate-limit     Whether or not to prevent rate limits. You may want to set this to
                                 false if You are using your own model. By default, we try to
                                 prevent rate limits, by using this flag you can disable this
                                 behavior
    -e, --endpoint <ENDPOINT>    The url of the codex endpoint [default:
                                 https://api.openai.com/v1/edits]
    -f, --file <FILE>            The target file path
        --fallback               Whether to fallback to "any" or not
    -h, --help                   Print help information
    -l, --lang <LANG>            The target language. Either `ts` or `py` [default: ts]
    -n, --n <N>                  The number of completions to return [default: 3]
    -o, --output <OUTPUT>        Output file directory path
    -r, --retries <RETRIES>      The number of request to send to Codex [default: 1]
    -s, --strategy <STRATEGY>    Completion strategy. Either: {"simple": simple completion, "tree":
                                 tree completion} [default: simple]
        --stop-at <STOP_AT>      The maximum number of type-checkable completions to return
                                 [default: 1]
    -t, --tokens <TOKENS>        Codex tokens to use, separated by commas
        --temp <TEMP>            The temperature to use for the completion [default: 1]
    -V, --version                Print version information
```

Type-correct solutions will be written to the specified directory.

_The appendix at the end of the paper provides a set of prompts and completions that our client produced._

\newpage

## Reflect

#### Initial Progress Goals

_"By now, we will have implemented type-inference for TypeScript using a simple approach that does not involve prompt engineering. This approach will allow us to correctly type-check small files such as LeetCode JavaScript solutions."_

#### Current Achievements

We achieved every goal that was listed in our initial project proposal for the first milestone. In addition, we added a heuristic $h$ to catch several erroneous cases and to save compute time.

- $h$ is evaluated _before_ we opt to type-check the solution, which saves compute time due to `tsc` being significantly more expensive to compute.
- $h$ verifies that the given completion does not contain any additional content that is not a type-annotation.
- $h$ protects against completions that type-check but contain permissive types such as `any`, `undefined`, and `unknown` (in some cases).

Additionally, we were surprised that this simple solution allowed us to type-infer medium-sized files (check appendix), as we expected to be able to only type-infer small files.

## Replan

#### Problem

While our current type-inference pipeline using Codex's `davinci-edit` model has shown good results, the strategy comes with a few limitations. First, the number of API calls to Codex has a limit of 20 per API key. For a single query, Codex allows for any number of completions to be requested. However, the completions are sorted in decreasing order of confidence; from testing, we have observed that the completions given beyond the 10th index are generally ususable.

#### Possible Solutions

We have considered several alterations/new methods for solving this problem.

- API key rotation: Apply for several Codex API keys to use to "rotate" to have access to a maximum of $N$ \* 20 completions per run, where $N$ is the number of API keys.
- Facebook's "InCoder" model: Use Facebook's open-source code-infill model which is open-source and available on Huggingface.
  - We would also be able to fine-tune the model to our specific type-inference purpose.

#### Plan Moving Forward

While the API key rotation strategy may give us access to significantly more completions, it is hard to secure new API keys from Codex in a timely manner. Therefore, we are writing an interface for querying the InCoder model. The InCoder strategy would theoretically allow us to make an infinite number of queries for an infinite number of completions returned per query. The only limitation for the InCoder strategy is the cumulative time to evaluate the model.

Additionally, we plan to apply our type-inference strategy (or a variation for our strategy) to other gradually-typed languages, such as Python.

\newpage

# Appendix

Our system was able to type-infer this program:

```ts
const findAllPeople = function (n, meetings, firstPerson) {
  meetings.sort((a, b) => a[2] - b[2]);
  const uf = new UnionFind(n);
  uf.connect(0, firstPerson);
  let ppl = [];
  for (let i = 0, len = meetings.length; i < len; ) {
    ppl = [];
    let time = meetings[i][2];
    while (i < len && meetings[i][2] === time) {
      uf.connect(meetings[i][0], meetings[i][1]);
      ppl.push(meetings[i][0]);
      ppl.push(meetings[i][1]);
      i++;
    }
    for (let n of ppl) {
      if (!uf.connected(0, n)) uf.reset(n);
    }
  }
  let ans = [];
  for (let i = 0; i < n; ++i) {
    if (uf.connected(0, i)) ans.push(i);
  }
  return ans;
};

class UnionFind {
  arr;

  constructor(n) {
    this.arr = Array(n).fill(null);
    this.arr.forEach((e, i, arr) => (arr[i] = i));
  }
  connect(a, b) {
    this.arr[this.find(a)] = this.find(this.arr[b]);
  }
  find(a) {
    return this.arr[a] === a ? a : (this.arr[a] = this.find(this.arr[a]));
  }
  connected(a, b) {
    return this.find(a) === this.find(b);
  }
  reset(a) {
    this.arr[a] = a;
  }
}
```

\newpage

And annotate it with these types:

```ts
const findAllPeople: (
  n: number,
  meetings: number[][],
  firstPerson: number
) => number[] = function (n, meetings, firstPerson) {
  meetings.sort((a, b) => a[2] - b[2]);
  const uf: UnionFind = new UnionFind(n);
  uf.connect(0, firstPerson);
  let ppl: number[] = [];
  for (let i = 0, len = meetings.length; i < len; ) {
    ppl = [];
    let time: number = meetings[i][2];
    while (i < len && meetings[i][2] === time) {
      uf.connect(meetings[i][0], meetings[i][1]);
      ppl.push(meetings[i][0]);
      ppl.push(meetings[i][1]);
      i++;
    }
    for (let n of ppl) {
      if (!uf.connected(0, n)) uf.reset(n);
    }
  }
  let ans: number[] = [];
  for (let i = 0; i < n; ++i) {
    if (uf.connected(0, i)) ans.push(i);
  }
  return ans;
};

class UnionFind {
  arr: number[];
  constructor(n) {
    this.arr = Array(n).fill(null);
    this.arr.forEach((e, i, arr) => (arr[i] = i));
  }
  connect(a: number, b: number): void {
    this.arr[this.find(a)] = this.find(this.arr[b]);
  }
  find(a: number): number {
    return this.arr[a] === a ? a : (this.arr[a] = this.find(this.arr[a]));
  }
  connected(a: number, b: number): boolean {
    return this.find(a) === this.find(b);
  }
  reset(a: number): void {
    this.arr[a] = a;
  }
}
```

\newpage
While TypeScript's type inference only managed to infer these types (too many `any`s and loose typing):

```ts
const findAllPeople = function (n: number, meetings: any[], firstPerson: any) {
  meetings.sort((a: number[], b: number[]) => a[2] - b[2]);
  const uf = new UnionFind(n);
  uf.connect(0, firstPerson);
  let ppl = [];
  for (let i = 0, len = meetings.length; i < len; ) {
    ppl = [];
    let time = meetings[i][2];
    while (i < len && meetings[i][2] === time) {
      uf.connect(meetings[i][0], meetings[i][1]);
      ppl.push(meetings[i][0]);
      ppl.push(meetings[i][1]);
      i++;
    }
    for (let n of ppl) {
      if (!uf.connected(0, n)) uf.reset(n);
    }
  }
  let ans = [];
  for (let i = 0; i < n; ++i) {
    if (uf.connected(0, i)) ans.push(i);
  }
  return ans;
};

class UnionFind {
  arr: any[];

  constructor(n: any) {
    this.arr = Array(n).fill(null);
    this.arr.forEach(
      (e: any, i: string | number, arr: { [x: string]: any }) => (arr[i] = i)
    );
  }
  connect(a: number, b: string | number) {
    this.arr[this.find(a)] = this.find(this.arr[b]);
  }
  find(a: string | number) {
    return this.arr[a] === a ? a : (this.arr[a] = this.find(this.arr[a]));
  }
  connected(a: number, b: number) {
    return this.find(a) === this.find(b);
  }
  reset(a: string | number) {
    this.arr[a] = a;
  }
}
```

Note that TypeScript's inference type annotated non let-bound arrow functions, while our system didn't. We believe that these functions should be left untyped, as the signature of the function that calls them should be typed, and TypeScript's type-inference should enforce those rules. Our system will not battle with TypeScript's type-inference, it will try to work alongside it. Additionally, our system will not perform any type-migrations, i.e. it will not change already defined types. This is to further enforce the coalition between our system and TypeScript's.

Additionally, our system was able to fill out generic types.

```ts
var sumFourDivisors = function (nums) {
  let res = 0;

  for (const e of nums) {
    const set = helper(e);
    if (set.size === 4) {
      for (const i of set) res += i;
    }
  }

  return res;

  function helper(num) {
    const set = new Set();
    const r = ~~(Math.sqrt(num) + 1);
    for (let i = 1; i < r; i++) {
      if (num % i === 0) {
        set.add(i);
        set.add(num / i);
      }
    }
    return set;
  }
};
```

to

```ts
var sumFourDivisors: (nums: number[]) => number = function (nums) {
  let res: number = 0;
  for (const e of nums) {
    const set: Set<number> = helper(e);
    if (set.size === 4) {
      for (const i of set) res += i;
    }
  }
  return res;
  function helper(num: number): Set<number> {
    const set: Set<number> = new Set();
    const r: number = ~~(Math.sqrt(num) + 1);
    for (let i = 1; i < r; i++) {
      if (num % i === 0) {
        set.add(i);
        set.add(num / i);
      }
    }
    return set;
  }
};
```

while TypeScript's inference couldn't give us a type-checkable answer:

```
7:28 - error TS2365: Operator '+=' cannot be applied to types 'number' and 'unknown'.

7       for (const i of set) res += i;
                             ~~~~~~~~
```
