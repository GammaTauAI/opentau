---
title: "Using OpenAI Codex for Gradual Type Inference"
author: Federico Cassano, Noah Shinn
geometry: "left=3cm,right=3cm,top=3cm,bottom=3cm"
output: pdf_document
---

## Authors and Division of Labor

- Federico Cassano
  - Rust client guy
  - Typescript guy
- Noah Shinn
  - Evaluation guy
  - Python guy

## Problem Description/Motivation

Gradually-typed languages allow optional type annotations. These languages are able to type-check these type-annotations but, however, are not able to type-check non-annotated sections of code. Some languages such as TypeScript employ a greedy approach to type-inference. This approach is a viable solution to the problem in smaller sections of code, but may lead to the algorithm falling-back to the `any` or `unknown` type. In the case of `any`, the program will type-check but the type-annotations are undesirable as the types are more permissive. Even worse, in the case of `unknown`, the program will not type-check despite there being a type-checkable solution. Our solution for TypeScript, to target this problem, is to reject the greedy approach in favor of a natural language model approach that uses additional features in the input. These features include but are not limited to: comments, identifier names, and operational semantics.

## Relevancy to Class Topics

For type annotation generation, we utilize the Codex davinci-edit model. The model is an autoregressive natural language model that allows users to give a prompt and an instruction as input and produces a modified output—the original input with the instruction applied. Natural language processing models are a subset of machine learning, which is a topic covered in this class. We also plan to use search techniques for finding the "best" type-checkable solutions for a given program.

## Ideal Results/Outcomes

## Milestones + Expected Week-by-Week Schedule
