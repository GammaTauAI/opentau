import os
import sys
import time
import json
import sched
import base64
import socket
import signal
from threading import Thread
from functools import partial


if len(sys.argv) != 4:
    print(f'usage: [path to socket] [pid of rust proc]')
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

# periodically check rust proc
def run_func(sc):
    is_pid_running(rust_pid)
    sc.enter(3, 1, run_func, (sc,))
s.enter(3, 1, run_func, (s,))
s.run()

# determines if rust proc is still running
def is_pid_running(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    else:
        return True

# used to store and close all sockets before exit
class SocketManager:
    def __init__(self) -> None:
        self._sockets = [] 

    def __call__(self, c: socket.socket) -> None:
        self._sockets.append(c)

    def close_all(self) -> None:
        for s in self._sockets:
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

# handles a single client
def on_client(c: socket.socket) -> None:
    try:
        while True:
            data = recvall(c)
            obj = json.loads(data) # FIXME: try catch
            decoded_text = base64.b64decode(obj.text)
            if obj.cmd == 'print':
                # TODO: send print
                NotImplemented()
            elif obj.cmd == 'tree':
                # TODO: gen tree
                NotImplemented()
            elif obj.cmd == 'stub':
                # TODO: gen stub
                NotImplemented()
            elif obj.cmd == 'check':
                # TODO: check completion
                NotImplemented()
            else:
                c.send(json.dumps({
                    'type': 'error',
                    'message': f'unknown command {obj.cmd}'
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
