import os
import sys
import subprocess


def stub(file: str) -> str:
    cmd = f'stubgen {file} --output . --no-import'
    sp = subprocess.Popen(cmd.split(), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = sp.communicate()
    if out:
        f_ = file.replace('py', 'pyi')
        s = ''
        with open(f_, 'r') as f:
            os.remove(f_)
            lines = f.readlines()
            for line in lines:
                if 'import' not in line:
                    s += line
            return s[1:-1]
    else:
        raise Exception(err.decode('utf-8'))


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(f'USAGE: {sys.argv[0]} example_typed.py')
        sys.exit(1)
    _FILE = sys.argv[1]
    print(stub(_FILE))
