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


if len(sys.argv) != 3:
    print(f'usage: [path to socket] [pid of rust proc]')
    sys.exit(1)

SOCK_PATH = sys.argv[1]
BUFF_SIZE = 4096

# checks if in use
try:
    os.unlink(SOCK_PATH)
except OSError:
    if os.path.exists(SOCK_PATH):
        print(f'{SOCK_PATH} already exists')
        sys.exit(1)

rust_pid = int(sys.argv[2])

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
# FIX ME, MAKE ME RUN CONCURRENTLY
# s.run()

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
    b64str = base64.b64encode(res.encode('utf-8')).decode('utf-8')
    return json.dumps({"type": "printResponse", "text": b64str})

# TODO: implement
def handle_tree(decoded_text: str) -> str:
    source_file = gen_source_file(decoded_text)
    assert isinstance(source_file, ast.AST)
    res = ...
    return json.dumps({"type": "treeResponse", "text": res})

def handle_stub(decoded_text: str) -> str:
    source_file = gen_source_file(decoded_text)
    assert isinstance(source_file, ast.AST)
    res = stub_source(source_file)
    b64str = base64.b64encode(res.encode('utf-8')).decode('utf-8')
    return json.dumps({"type": "stubResponse", "text": b64str})

def handle_check(decoded_text: str, req: Any) -> str:
    decoded_original = base64.b64decode(req['original']).decode('utf-8')
    original_file = gen_source_file(decoded_original, with_comments=True)
    completed_file = gen_source_file(decoded_text, with_comments=True)
    assert isinstance(original_file, RedBaron)
    assert isinstance(completed_file, RedBaron)
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
            if data == b'':
                c.close()
                break
            req_ = data.decode('utf-8')
            req = json.loads(req_)
            decoded_text = base64.b64decode(req['text']).decode('utf-8')
            cmd = req['cmd']
            if cmd == 'print':
                res = handle_print(decoded_text)
                c.send(res.encode('utf-8'))
            elif cmd == 'tree':
                res = handle_tree(decoded_text)
                c.send(res.encode('utf-8'))
            elif cmd == 'stub':
                res = handle_stub(decoded_text)
                c.send(res.encode('utf-8'))
            elif cmd == 'check':
                res = handle_check(decoded_text, req)
                c.send(res.encode('utf-8'))
            elif cmd == 'weave':
                res = handle_weave()
                c.send(res.encode('utf-8'))
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
        # Thread(target=on_client, args=(c,))
        on_client(c)

# called on exit signal
def close(_, __, sm: SocketManager) -> None:
    print(f'Closing {SOCK_PATH}')
    sm.close_all()
    sys.exit(0)

# init socket manager
sm = SocketManager()
sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
sock.bind(SOCK_PATH)
sock.listen(1)
# store socket for future close
sm(sock)

# this should work but should be tested
# other way is to use a lambdas
signal.signal(signal.SIGINT, partial(close, sm)) # type: ignore
print(f'Listening on {SOCK_PATH}\n')
# flush stdout
sys.stdout.flush()
init_wait(sock, sm)
