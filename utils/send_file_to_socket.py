import sys
import json
import socket
import base64


if len(sys.argv) != 4:
    print("Usage: {} <socket> <cmd> <file>".format(sys.argv[0]))
    sys.exit(1)

sock = sys.argv[1]
fileName = sys.argv[3]

data = open(fileName, "rb").read()

# json format:
# {
#   "cmd": "cmd",
#   "text": "base64 encoded data"
# }

msg = {
    "cmd": sys.argv[2],
    "text": base64.b64encode(data).decode("utf-8")
}

print ("Sending msg: {}".format(msg))

msg = json.dumps(msg)
b = msg.encode("utf-8")

s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
s.connect(sock)
s.sendall(b)

# read the response and print it, receive all data until EOF
data = s.recv(12288)
res = data.decode("utf-8")
try:
    jsonDecoded = json.loads(res)
    base64Decoded = base64.b64decode(jsonDecoded["text"]).decode("utf-8")

    if sys.argv[2] == "tree":
        # text is other json, decode it
        jsonDecoded = json.loads(base64Decoded)
        base64Decoded = json.dumps(jsonDecoded, indent=4)

    print("Whole response is:\n {}".format(jsonDecoded))
    print("Text is:\n {}".format(base64Decoded))
except:
    print("Error decoding response")
    print("Response is:\n {}".format(res))

s.close()
