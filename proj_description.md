---
title: "Using OpenAI Codex for Gradual Type Inference"
author: Federico Cassano, Noah Shinn
geometry: "left=3cm,right=3cm,top=3cm,bottom=3cm"
output: pdf_document
---

## Authors and Division of Labor
- Federico Cassano
  - Responsible for designing and implementing the language server protocol and client implementation
  - Responsible for implementing the TypeScript server.
- Noah Shinn
  - Responsible for designing and implementing an evaluation framework for comparing our system to others.
  - Responsible for implementing the Python server.

## Problem Description and Motivation
Gradually-typed languages allow optional type annotations. These languages are able to type-check these type-annotations but, however, are not able to type-check non-annotated sections of code. Some languages such as TypeScript employ a greedy approach to type-inference. This approach is a viable solution to the problem in smaller sections of code, but may lead to the algorithm falling-back to the `any` or `unknown` type. In the case of `any`, the program will type-check but the type-annotations are undesirable as the types are more permissive. Even worse, in the case of `unknown`, the program will not type-check despite there being a type-checkable solution. Our solution for TypeScript, to target this problem, is to reject the greedy approach in favor of a natural language model approach that uses additional features in the input. These features include but are not limited to: comments, identifier names, and operational semantics.

## Relevancy to Class Topics
For type annotation generation, we utilize Codex's `davinci-edit` model. `davinci-edit` an autoregressive natural language model that allows users to give a prompt and an instruction as input and produces a modified output (which is the original input with the instruction applied). Natural language processing models are a subset of machine learning, which is a topic covered in this class. We also plan to use search techniques for finding optimal type-checkable solutions for a given program (solutions with the `any` type are considered less optimal).

## Ideal Results and Outcomes

### Minimal Viable Product
Our minimal viable product will be a system that will type annotate and migrate JavaScript code to TypeScript code as well as simply type annotate TypeScript code. In the latter case, the input will be turned into a strictly typed program. We will evaluate the performance over a 100-file dataset of Leetcode JavaScript solutions. Our solution will ensure that the output code from Codex will only have type annotations, not any other artifact. Our minimal viable product should be able to correctly type annotate 60% of the given files, where there exists at least one type-checkable solution.

### Stretch-Goal Product
Our stretch goal will be to create a protocol (similar to the LSP) that allows type-annotation over an arbitrary set of languages. Our solution will utilize different prompt engineering techniques to maximize the quality of the resulting type annotations. Our far-fetched goal is to fine-tune a large language model for our specific task—type annotation. Finally, we would like to make a VSCode extension that would use our model to type-annotate a portion of user-selected code. We would like our stretch-goal product to beat currently existing probabilistic type-inference systems such as DeepTyper and LambdaNet.

## Milestones + Expected Week-by-Week Schedule

### Milestone 1 - Due 11/4
By now, we will have implemented type-inference for TypeScript using a simple approach that does not involve prompt engineering. This approach would allow us to correctly type-check small files such as Leetcode JavaScript solutions.

### Milestone 2 - Due 11/22
By now, we will have implemented type-inference for Python and a prompt engineering approach that would allow us to type-infer larger files.

### Final Submit - Due 12/13
By the final submission, we will have a strong evaluation framework that will allow us to compare our solutions to other type inference systems for the given language. We will also have data created by our framework that shows the efficacy of our solutions. Efficacy will be defined as whether or not the solution type-checks as well as the quality of the type annotations.

