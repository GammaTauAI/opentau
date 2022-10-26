import cgi
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

from infill import infill

from typing import NamedTuple
HOST = '127.0.0.1'
PORT = 8000


class PostData(NamedTuple):
    input: str
    n: int
    temperature: float

def _parse_post_data(form: cgi.FieldStorage) -> PostData:
    input: str = form.getvalue('input')
    n: int = int(form.getvalue('retries'))
    temperature: float = float(form.getvalue('temperature'))

    # check that all fields are given
    if input is None:
        raise TypeError('input not given')
    elif n is None:
        raise TypeError('n not given')
    elif temperature is None:
        raise TypeError('temperature not given')
    return PostData(input, n, temperature)

class IncoderServer(BaseHTTPRequestHandler):
    def do_POST(self) -> None:
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={'REQUEST_METHOD': 'POST'}
        )
        # unpack post data
        input, n, temperature = _parse_post_data(form)

        # call model
        res = infill(
            input=input,
            max_to_generate=1,
            temperature=temperature,
            max_retries=n
        )
        # send response
        self.wfile.write(json.dumps({
            "success": True,
            "input": input,
            "completion": res
        }).encode('utf-8'))


if __name__ == '__main__':
    server = HTTPServer((HOST, PORT), IncoderServer)
    print('incoder server is now running!')
    server.serve_forever()
    server.server_close()
