# OpenTau: Using Large Language Models for Gradual Type Inference

Implementation for the paper: [Type Prediction With Program Decomposition and Fill-in-the-Type Training. Federico Cassano, Ming-Ho Yee, Noah Shinn, Arjun Guha, Steven Holtzen.](https://arxiv.org/abs/2305.17145)

Type inference for gradually-typed languages such as TypeScript and Python has become increasingly prevalent in the field of programming languages.
However, current approaches often struggle with inferring descriptive types in cases in which user-defined type annotations are absent,
especially when inferring function signatures.

This has motivated automated type prediction: given an untyped program, produce a well-typed output program. Large language models (LLMs) are promising for type prediction, but there are challenges: fill-in-the-middle performs poorly, programs may not fit into the context window, generated types may not type check, and it is difficult to measure how well-typed the output program is. We address these challenges by building OpenTau, a search-based approach for type prediction that leverages large language models. We propose a new metric for type prediction quality, give a tree-based program decomposition that searches a space of generated types, and present fill-in-the-type fine-tuning for LLMs. We evaluate our work with a new dataset for TypeScript type prediction, and show that 47.4% of files type check (14.5% absolute improvement) with an overall rate of 3.3 type errors per file.

Additionally, we build two protocols for implementing additional languages and models.
In our work, we implement a TypeScript compiler that respects the protocol and a SantaCoder server that
respects the other protocol.
An optional OpenAI model endpoint also implements the protocol, but it is unmaintained and not recommended for use.
Implementing the respective protocols is relatively straightforward. More information can be found in our [class final project submission](https://github.com/GammaTauAI/opentau/blob/main/docs/final_report.md) (as this work started as a class project for [CS 4100 at Northeastern University](https://www.khoury.northeastern.edu/home/sholtzen/assets/pdf/cs4100-fall22-syllabus.pdf)).

## Cite

```bibtex
@misc{cassano2023type,
      title={Type Prediction With Program Decomposition and Fill-in-the-Type Training}, 
      author={Federico Cassano and Ming-Ho Yee and Noah Shinn and Arjun Guha and Steven Holtzen},
      year={2023},
      eprint={2305.17145},
      archivePrefix={arXiv},
      primaryClass={cs.SE}
}
```

## Usage

We have implemented an OpenTau in Rust, which can be utilized in three ways:

1. As a simple CLI client that will type-infer a given program. (more info in `./client`)
2. As a library, that exposes numerous abstractions for interacting with different compilers, models, and type prediction strategies. (more info in `./client`)
3. As an evaluation tool, to analyze the performance of the combinations of different models, languages, datasets, and type prediction strategies
   on the task of type prediction. (more info in `./evaluator`)

We are in the review process for our paper:
[Type Prediction With Program Decomposition and Fill-in-the-Type Training. Federico Cassano, Ming-Ho Yee, Noah Shinn, Arjun Guha, Steven Holtzen.](https://arxiv.org/abs/2305.17145)

## Requirements

- `rust`
- Incoder/SantaCoder model requirements:
  - `torch`
  - `tokenizers>=0.12`
  - `transformers`
- TypeScript compiler requirements:
  - `ts-node`
  - `tsc`
- Python compiler requirements (Work in progress):
  - `mypy` | `pyright` for static type checking
  - `redbaron` for AST parsing with comments
- `pandoc` ONLY for building the report

## Installation

Run `make` while being in the directory

The output binary (symlinked) will be at `/out/client`

## Example completion

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

#### Another Example: Generics Inference

Our system is able to fill out generic types.

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