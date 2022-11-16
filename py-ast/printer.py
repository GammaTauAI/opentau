from redbaron import RedBaron

_FAKE_TYPE = '_hole_'


def handle_func(func) -> None:
    handle_arguments(func)
    handle_return(func)

def handle_arguments(func) -> None:
    for arg in func.arguments:
        if arg.annotation is None and arg.target.value != 'self':
            arg.annotation = _FAKE_TYPE

def handle_return(func) -> None:
    if func.return_annotation is None:
        func.return_annotation = _FAKE_TYPE

def handle_assignment(a) -> None:
    if a.annotation is None:
        a.annotation = _FAKE_TYPE

def handle_source(source: RedBaron) -> None:
    funcs = source.find_all('DefNode')
    assignments = source.find_all('AssignmentNode')
    for func in funcs:
        handle_func(func)
    for a in assignments:
        handle_assignment(a)

def print_source(source_file: RedBaron) -> str:
    handle_source(source_file)
    return source_file.dumps()


""" TEST
if __name__ == '__main__':
    with open('./temp.py', 'r') as f:
        source_file = RedBaron(f.read())
        res = print_source(source_file)
        print(res)
"""

