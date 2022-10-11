import os
import sys
import time
import json
import sched
import base64
import socket


if len(sys.argv) != 4:
    print(f'usage: [path to socket] [pid of rust proc]')
    sys.exit(1)

SERVER_ADDR = sys.argv[2]

try:
    os.unlink(SERVER_ADDR)
except OSError:
    if os.path.exists(SERVER_ADDR):
        print(f'{SERVER_ADDR} already exists')
        sys.exit(1)

# periodically check rust proc
rust_pid = int(sys.argv[3])

s = sched.scheduler(time.time, time.sleep)

def run_func(sc):
    is_pid_running(rust_pid)
    sc.enter(3, 1, run_func, (sc,))
s.enter(3, 1, run_func, (s,))
s.run()

def is_pid_running(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    else:
        return True

def recvall(sock: socket.socket):
    BUFF_SIZE = 4096
    data = b''
    while True:
        part = sock.recv(BUFF_SIZE)
        data += part
        if len(part) < BUFF_SIZE:
            # either 0 or end of data
            break
    return data

def init_wait(s: socket.socket) -> None:
    while True:
        c, client_addr = s.accept()
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

sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
sock.bind(SERVER_ADDR)
sock.listen(1)
print(f'Listening on {SERVER_ADDR}\n')
init_wait(sock)
