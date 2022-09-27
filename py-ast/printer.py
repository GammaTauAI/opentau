"""
NOT FINISHED

"""

import sys

from mypy import defaults
from mypy.parse import parse
from mypy.options import Options

assert len(sys.argv) == 2
_FILE = sys.argv[1]


def main() -> None:
    options = Options()
    options.python_version = defaults.PYTHON3_VERSION
    with open(_FILE, 'rb') as f:
        s = f.read()
        tree = parse(s, _FILE, None, errors=None, options=options)
        print(tree)


if __name__ == '__main__':
    main()
