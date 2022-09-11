import sys
import socket


if len(sys.argv) != 3:
    print("Usage: {} <socket> <file>".format(sys.argv[0]))
    sys.exit(1)

sock = sys.argv[1]
fileName = sys.argv[2]

data = open(fileName, "rb").read()

s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
s.connect(sock)
s.sendall(data)

# read the response and print it
response = s.recv(4096)
print(response.decode("utf-8"))
