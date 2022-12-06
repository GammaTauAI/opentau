import json
from http.server import HTTPServer, BaseHTTPRequestHandler

from infill import infill

HOST = '127.0.0.1'
PORT = 8000


class IncoderServer(BaseHTTPRequestHandler):
    def do_POST(self) -> None:
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()

        # unpack data from client
        l = int(self.headers.get('Content-Length'))
        body = json.loads(self.rfile.read(l).decode('utf8'))
        if body['input'] is None:
            raise TypeError('input not given')
        elif body['n'] is None:
            raise TypeError('n not given')
        elif body['temperature'] is None:
            raise TypeError('temperature not given')

        # call model
        res = infill(
            input=body["input"],
            n=body["n"],
            temperature=body["temperature"],
        )

        # send response
        self.wfile.write(json.dumps({ "choices": [{"text": r} for r in res] }).encode('utf-8'))


if __name__ == '__main__':
    # start up server
    server = HTTPServer((HOST, PORT), IncoderServer)
    print('incoder server is now running!')
    server.serve_forever()
    server.server_close()
