from redbaron import RedBaron, redbaron

_FAKE_TYPE = '_hole_'


def _handle_func(func) -> None:
    _handle_arguments(func)
    _handle_return(func)

def _handle_arguments(func) -> None:
    for arg in func.arguments:
        if arg.annotation is None and arg.target.value != 'self':
            arg.annotation = _FAKE_TYPE

def _handle_return(func) -> None:
    if func.return_annotation is None:
        func.return_annotation = _FAKE_TYPE

def _handle_assignment(a) -> None:
    if not isinstance(a.target, redbaron.nodes.TupleNode) \
        and a.operator == '' \
        and a.annotation is None:
        a.annotation = _FAKE_TYPE

def _handle_source(source: RedBaron, handle_assignments: bool) -> None:
    funcs = source.find_all('DefNode')
    assignments = source.find_all('AssignmentNode')
    for func in funcs:
        _handle_func(func)
    if handle_assignments:
        for a in assignments:
            _handle_assignment(a)

def print_source(source_file: RedBaron, handle_assignments: bool = False) -> str:
    _handle_source(source_file, handle_assignments)
    out = source_file.dumps()
    return out


""" TEST
if __name__ == '__main__':
    with open('./__original.py', 'r') as f:
        source_file = RedBaron(f.read())
        res = print_source(source_file)
        print(res)
"""

