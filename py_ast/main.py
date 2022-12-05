import os
import sys
import ast
import time
import json
import sched
import base64
import socket
import signal
from threading import Thread
from redbaron import RedBaron
from functools import partial

from printer import print_source
from check import check_completed
from stub_printer import stub_source

from typing import Any, Union


if len(sys.argv) != 4:
    print(f'usage: [path to socket] [server addr] [pid of rust proc]')
    sys.exit(1)

SERVER_ADDR = sys.argv[2]
BUFF_SIZE = 4096

# checks if in use
try:
    os.unlink(SERVER_ADDR)
except OSError:
    if os.path.exists(SERVER_ADDR):
        print(f'{SERVER_ADDR} already exists')
        sys.exit(1)

rust_pid = int(sys.argv[3])

s = sched.scheduler(time.time, time.sleep)

# determines if rust proc is still running
def is_pid_running(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    else:
        return True

# periodically check rust proc
def run_func(sc):
    is_pid_running(rust_pid)
    sc.enter(3, 1, run_func, (sc,))

s.enter(3, 1, run_func, (s,))
s.run()

# used to store and close all sockets before exit
class SocketManager:
    def __init__(self) -> None:
        self._sockets = set()

    def __call__(self, c: socket.socket) -> None:
        self._sockets.add(c)

    def close_all(self) -> None:
        while len(self._sockets) > 0:
            s = self._sockets.pop()
            s.close()

# an unbounded recv
def recvall(s: socket.socket) -> bytes:
    data = b''
    while True:
        part = s.recv(BUFF_SIZE)
        data += part
        if len(part) < BUFF_SIZE:
            break
    return data

def gen_source_file(decoded_text: str, with_comments: bool = False) -> Union[ast.AST, RedBaron]:
    if with_comments:
        return RedBaron(decoded_text)
    return ast.parse(decoded_text)

def handle_print(decoded_text: str) -> str:
    source_file = gen_source_file(decoded_text, with_comments=True)
    assert isinstance(source_file, RedBaron)
    res = print_source(source_file)
    # FIXME: figure out output format
    return json.dumps({"type": "printResponse", "text": res})

# TODO: implement
def handle_tree(decoded_text: str) -> str:
    source_file = gen_source_file(decoded_text)
    assert isinstance(source_file, ast.AST)
    res = ...
    # FIXME: figure out output format
    return json.dumps({"type": "treeResponse", "text": res})

def handle_stub(decoded_text: str) -> str:
    source_file = gen_source_file(decoded_text)
    assert isinstance(source_file, ast.AST)
    res = stub_source(source_file)
    # FIXME: figure out output format
    return json.dumps({"type": "stubResponse", "text": res})

def handle_check(decoded_text: str, req: Any) -> str:
    decoded_original = str(base64.b64decode(req.original))
    original_file = gen_source_file(decoded_original)
    completed_file = gen_source_file(decoded_text)
    assert isinstance(original_file, RedBaron)
    assert isinstance(completed_file, RedBaron)
    # FIXME: fix type return
    text, score = check_completed(
        original_ast=original_file,
        completed_ast=completed_file,
    )
    return json.dumps({"type": "checkResponse", "text": text, "score": score})

# TODO: implement
def handle_weave() -> str:
    NotImplemented()
    return ''

# handles a single client
def on_client(c: socket.socket) -> None:
    try:
        while True:
            data = recvall(c)
            req = json.loads(data)
            decoded_text = str(base64.b64decode(req.text))
            if req.cmd == 'print':
                res = handle_print(decoded_text)
                c.send(bytes(res, 'utf-8'))
            elif req.cmd == 'tree':
                res = handle_tree(decoded_text)
                c.send(bytes(res, 'utf-8'))
            elif req.cmd == 'stub':
                res = handle_stub(decoded_text)
                c.send(bytes(res, 'utf-8'))
            elif req.cmd == 'check':
                res = handle_check(decoded_text, req)
                c.send(bytes(res, 'utf-8'))
            elif req.cmd == 'weave':
                res = handle_weave()
                c.send(bytes(res, 'utf-8'))
            else:
                c.send(json.dumps({
                    'type': 'error',
                    'message': f'unknown command {req.cmd}'
                }).encode())

    finally:
        c.close()

# listen for clients
def init_wait(s: socket.socket, sm: SocketManager) -> None:
    while True:
        c, _ = s.accept()
        sm(c)
        Thread(target=on_client, args=(c,))

# called on exit signal
def close(_, __, sm: SocketManager) -> None:
    print(f'Closing {SERVER_ADDR}')
    sm.close_all()
    sys.exit(0)

# init socket manager
sm = SocketManager()
sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
sock.bind(SERVER_ADDR)
sock.listen(1)
# store socket for future close
sm(sock)

# this should work but should be tested
# other way is to use a lambdas
signal.signal(signal.SIGINT, partial(close, sm)) # type: ignore
print(f'Listening on {SERVER_ADDR}\n')
init_wait(sock, sm)
