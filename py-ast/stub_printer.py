import os
import ast
import subprocess

TMP_DIR = '/tmp'
TMP_FILE = os.path.join(TMP_DIR, 'temp__.py')


def stub_source(source_file: ast.AST) -> str:
    with open(TMP_FILE, 'w') as f:
        f.write(ast.unparse(source_file))
    cmd = f'stubgen {TMP_FILE} --output {TMP_DIR} --no-import'
    sp = subprocess.Popen(cmd.split(), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = sp.communicate()
    if out:
        pyi = f'{TMP_FILE}i'
        s = ''
        with open(pyi, 'r') as f:
            lines = f.readlines()
            for line in lines:
                if 'import' not in line:
                    s += line
            os.remove(pyi)
            os.remove(TMP_FILE)
            return handle_cutoff_err(s[1:-1])
    else:
        raise Exception(err.decode('utf-8'))

def handle_cutoff_err(s: str) -> str:
    if s.startswith('ef'):
        return 'def' + s[2:]
    return s

""" TEST
if __name__ == '__main__':
    with open('./temp.py', 'r') as f:
        res = stub_source(ast.parse(f.read()))
        print(res)
"""
