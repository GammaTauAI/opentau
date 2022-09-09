# ML type inference for grad-typed language

- Using OpenAI codex (edit api?)

#### Generalized approach for making an abstract way for all lagnauges:

- For each language, we require the language designer to provide us with places that can be type annotated, like variable definitions and function definitions

  - example (typescript):

    ```ts
    function myFunction(a, b) {
      console.log("hi");
      return a * b;
    }

    console.log(myFunction(1, 2));
    ```

    we actually translate it into

    ```ts
    function myFunction(a: /* give type */, b: /* give type */ ): /* give type */ {
      console.log("hi");
      return a * b;
    }

    console.log(myFunction(1, 2));
    ```

  - example (python):

    ```py
    def myFunction(a, b):
      print "hi"
      return a * b

    print(myFunction(1, 2))
    ```

    we actually translate it into

    ```py
    def myFunction(a: """ give type """, b: """ give type """) -> """ give type """:
      print "hi"
      return a * b

    print(myFunction(1, 2))
    ```

- Then, we provide the translated AST to Codex, asking it to fill in the blank for the ret-type and var types.
  - resources for edit api: https://openai.com/blog/gpt-3-edit-insert/
- Codex gives us some kind of type-annotated AST
- We print the AST back into source code, and we run it with the type-checker of whatever language we had
- ???
- Profit!

# Challenges

- Figure out openai codex api, especially the edit api
- Figure out an abstracted way to easily make the thing work with any language with little changes needed
- Figure out how to write generalizable tests for the outputs
- This approach breaks on big software, so we have to break up parts of code into smaller pieces, therefore we have to figure that out. Although it might be okay just for the final project to work on smaller code snippets.


<!-- how --!>
