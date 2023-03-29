import json
import socket

unix_socket_path = '/tmp/mysock'
unix_socket = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
unix_socket.connect(unix_socket_path)
payload = {
        "code": "function add(a: _hole_, b: _hole_) { return a + b }",
        "num_samples": 1,
        "temperature": 1.0,
        "should_sample_single": True,
}
unix_socket.sendall(json.dumps(payload).encode("utf-8"))

response = unix_socket.recv(1024)
print(response.decode())
unix_socket.close()
