import os
import openai

complete_me = """
function hello(name: /* insert type here */): string {
    function inner(): /* insert type here */ {
        let myStuff: /* insert type here */ = "Hello, ";
        return myStuff;
    }
    return inner() + name;
}
console.log(hello("Noah"));
"""

print(openai.Engine.list())

openai.organization = "org-374QIoeWQBMgw8k2071ZxQh1"
openai.api_key = os.getenv("OPENAI_API_KEY")
comp = openai.Completion.create(
    engine="code-davinci-edit-001",
    instructions=complete_me,
    prompt=complete_me
)
print(comp)
