import datasets
import os
import json
import time
import base64
import subprocess
from typing import Tuple
import socket

from tree_sitter import Language, Parser

Language.build_library(
    'build/lang.so',
    [
        './tree-sitter-typescript/typescript'
    ]
)
LANGUAGE = Language('build/lang.so', 'typescript')
PARSER = Parser()
PARSER.set_language(LANGUAGE)


def sendrecv_sock(sock, data) -> str:
    s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    s.connect(sock)

    # send in chunks of 1024 bytes
    for i in range(0, len(data), 1024):
        s.send(data[i:i+1024])

    s.send(b'??END??')

    data = s.recv(122880)  # reaaal bad way to do this
    res = data.decode('utf-8')
    s.close()
    return res


LANG_SERVER = None


def type_errors(code: str, client_path: str) -> int:
    global LANG_SERVER

    code = base64.b64encode(code.encode('utf-8')).decode('utf-8')

    npm_server_path = f'{client_path}/ts-compiler'

    this_pid = os.getpid()
    sock_path = f"/tmp/test-sock-{this_pid}.sock"

    # run the server if it's not running
    if not LANG_SERVER:
        # close socket if it exists
        if os.path.exists(sock_path):
            os.remove(sock_path)
        cmd = f"npm start {sock_path} {this_pid}"
        proc = subprocess.Popen(
            cmd.split(), cwd=npm_server_path, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        # wait for the server to start. really bad way to do this
        time.sleep(3)
        LANG_SERVER = proc

    # req to send to the server
    req = {
        "cmd": "typecheck",
        "text": code,
    }

    # send the request
    errors = json.loads(sendrecv_sock(
        sock_path, json.dumps(req).encode('utf-8')))["errors"]

    return errors


def find_usages(code: str, outer: str,  client_path: str) -> str:
    global LANG_SERVER

    code = base64.b64encode(code.encode('utf-8')).decode('utf-8')
    outer_code = base64.b64encode(outer.encode('utf-8')).decode('utf-8')

    npm_server_path = f'{client_path}/ts-compiler'

    this_pid = os.getpid()
    sock_path = f"/tmp/test-sock-{this_pid}.sock"

    # run the server if it's not running
    if not LANG_SERVER:
        # close socket if it exists
        if os.path.exists(sock_path):
            os.remove(sock_path)
        cmd = f"npm start {sock_path} {this_pid}"
        proc = subprocess.Popen(
            cmd.split(), cwd=npm_server_path, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        # wait for the server to start. really bad way to do this
        time.sleep(3)
        LANG_SERVER = proc

    # req to send to the server
    req = {
        "cmd": "usages",
        "text": outer_code,
        "innerBlock": code,
    }

    # send the request
    usages = json.loads(sendrecv_sock(
        sock_path, json.dumps(req).encode('utf-8')))["text"]
    decdoded_usages = base64.b64decode(usages).decode('utf-8')

    return decdoded_usages


CODE = """
function add(a, b) {
  return a + b;
}
"""

OUTER_CODE = """
console.log(add(1, 2));
function add3(a, b, c) {
    return add(add(a, b), c);
}
"""
TEST_CODE = """
function joe(p) {
  if (p.name === "Joe") {
    return p;
  } else {
    return new Person("Joe");
  }
}

const mike = (p) => {
  if (p.name === "Mike") {
    return p;
  } else {
    const person = new Person("Mike");
    return person;
  }
};

var steve = function (p) {
  if (p.name === "Steve") {
    return p;
  } else {
    var person = new Person("Steve");
    return person;
  }
};

let bob = function (p) {
  if (p.name === "Bob") {
    return p;
  } else {
    var person = new Person("Bob");
    return person;
  }
};

console.log(joe(new Person("Joe")).sayHello());
console.log(mike(new Person("Mike")).sayHello());
console.log(steve(new Person("Steve")).sayHello());
console.log(new Person("Joe").make_house(new Person("Mike")).person.name);
console.log(new Person("Mike").make_house(new Person("Joe")).person.name);
console.log(new Person("Joe").getHouse().person.name);
"""
print(find_usages(CODE, OUTER_CODE, '../../../'))
tree = PARSER.parse(bytes(CODE, "utf-8"))
print(tree.root_node.sexp())

FUNCTION_QUERY = LANGUAGE.query("""
(function_declaration) @function
(variable_declarator value: (function)) @e-function
(variable_declarator value: (arrow_function)) @e-function
""")


ds = datasets.load_dataset("nuprl/ts-eval", split="test")


def annotate_with_usages(code: str) -> str:
    code_bytes = bytes(code, "utf-8")
    code_with_usages = code
    tree = PARSER.parse(code_bytes)
    captures = FUNCTION_QUERY.captures(tree.root_node)
    for c, ty in captures:
        if ty == "e-function":
            c = c.parent
            assert c is not None

        fn_code = code_bytes[c.start_byte:c.end_byte].decode("utf-8")
        usages = find_usages(fn_code, code, '../../../')
        if usages == "":
            continue  # no usages

        code_with_usages = code_with_usages.replace(
            fn_code, f"{usages}{fn_code}")
        code_with_usages_errors = type_errors(
            code_with_usages, '../../../')
        code_errors = type_errors(code, '../../../')
        if not code_with_usages_errors == code_errors:
            # write to file
            with open("error.ts", "w") as f:
                f.write(code_with_usages)
            raise Exception("type errors changed")


    return code_with_usages


print(annotate_with_usages(TEST_CODE))

ds = ds.map(lambda x: {"content_without_annotations": annotate_with_usages(
    x["content_without_annotations"])},
    batched=False,
    batch_size=1,
)


ds.push_to_hub("nuprl/ts-eval-with-usages")

# kill the server
LANG_SERVER.kill()
