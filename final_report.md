---
title: "Using OpenAI Codex for Gradual Type Inference"
subtitle: "Final Report"
author: Federico Cassano, Noah Shinn
geometry: "left=3cm,right=3cm,top=3cm,bottom=3cm"
output: pdf_document
---

\newpage

# Abstract
Type inference for gradually-typed languages such as TypeScript and Python has become increasingly prevalent in the field of programming languages. However, current approaches often struggle with inferring descriptive types in cases in which user-defined type annotations are absent, especially when inferring function signatures. In our dataset, we found that TypeScript's inference procedure was only able to correctly type-infer 59% of the given files. Furthermore, we found that the quality of the type annotations were permissive, which may lead to an increased number of dynamic type errors, which makes the procedure ineffective in practice. In this report, we show an effective use of large natural language models to aid these type inference procedures. Our approach utilizes static insertion of type holes to generate a prompt to be edited by a language model. Our paper mainly uses Codex's *code-davinci-edit* model for TypeScript type inference. Additionally, we also explore other languages such as Python and other language models such as Facebook's *InCoder* model. Across our dataset, we were able to type-infer 91% of the files with descriptive, high quality type annotations.

\newpage

# Final report

### Introduction


##### Motivating Example and Problem

Given this untyped file,
```ts
const kClosest = (points, K) => {
  let len = points.length,
    l = 0,
    r = len - 1
  while (l <= r) {
    let mid = helper(points, l, r)
    if (mid === K) break
    if (mid < K) {
      l = mid + 1
    } else {
      r = mid - 1
    }
  }
  return points.slice(0, K)
}

function helper(A, l, r) {
  ...
}
```

TypeScript's inference procedure gives this completion:
```ts
const kClosest: (
  points: any,
  K: any
) => any = (points, K) => {
  let len: any = points.length,
    l: number = 0,
    r: number = len - 1;
  while (l <= r) {
    let mid: any = helper(points, l, r);
    if (mid === K) break;
    if (mid < K) {
      l = mid + 1;
    } else {
      r = mid - 1;
    }
  }
  return points.slice(0, K);
};

function helper(A: any, l: any, r: any): any {
  ...
}
```

While the completion from TypeScript's inference procedure may successfully type check, it is important to note the overuse of the `any` type annotation. For example, note the `any` annotation for the `points` parameter. On the first line of the function, `points.length` is being accessed. Given the context, it would seem rational to type-annotate `points` with `any[]`. However, consider the case that the `kClosest` function is given `{ length: 3 }` as the `points` argument. Clearly, `{ length: 3 }` is not an `any[]`. However, a deterministic type inference procedure must consider this case. Therefore, annotating the `points` argument with `any` is the most rational decision in this case. This problem motivates the use of a probabilistic approach to overcome similar cases.

For a simple approach, we could feed the program to a natural language model that is able to make edits on the prompt. We would instruct the model to insert type annotations on the given untyped TypeScript program. The model would output a set of completions that *may* be type-annotated. Then, we would need a way to validate the given completions to find correctly annotated programs.

### Simple Implementation

Our high-level approach to type-inference via Codex is the following:

- 1. We insert the identifier `_hole_` in place of missing types in our input JavaScript program. To do this, we use a compiler $\mathcal{K} : \text{File} \rightarrow \mathcal{P}$.
- 2. We define an instruction $\mathcal{I}$, which is the constant string:  
     $\mathcal{I} = \text{"Substitute the identifier \_hole\_ with the correct type."}$
- 3. We query the `davinci-edit` model using the compiled prompt $\mathcal{P}$ and instruction $\mathcal{I}$. We receive back a set of completions $\mathcal{C}$, $0 \leq |\mathcal{C}| \leq n$, where $n$ is a pre-defined maximum number of completions.
- 4. We use a cheap and admissible heuristic $h : c \rightarrow (\text{Boolean},\ \mathcal{N})$ that determines if a given completion $c$ is _correct_ (a _correct_ completion however, may still not type-check) and the quality of the type annotations $q$, where the lower the $q$ the better.
- 5. We apply $h$ to all elements in $\mathcal{C}$ and we add the completions that produced $\text{True}$ to an ordered set $\mathcal{Q}$ sorted by $q$.
- 6. Using the command: `tsc --allowJs --checkJs --noEmit --target es2022 <file.ts>` we run a full type-check on every completion in $\mathcal{Q}$, terminating as soon as the command returns code `0`, meaning that the completion is type-correct. By terminating early on the sorted set, we guarantee that our solution is optimal with respect to $\mathcal{Q}$. We let $c^*$ be the optimal type-correct solution.
- 7. We produce $c^*$ if it exists, otherwise we produce an error.

#### Compiler

We have implemented $\mathcal{K}$ by interfacing with the TypeScript compiler API for inserting type-holes into identifiers that lack type annotations.

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

#### Completion Validation Heuristic

We have implemented our heuristic $h$. The heuristic traverses the program's abstract syntax tree identifying different types, which will be scored. Some types terminate the heuristic early and denote that the program cannot possibly be correct. The scores are summed to compose $q$ using the following table:

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

Additionally, $h$ checks if the model didn't add anything other than just types (such as additonal code blocks and comments) to the original prompt. If that condition isn't met, $(\text{False}, 0)$ will be produced.

### Scalable Prompt Engineering Implementation






