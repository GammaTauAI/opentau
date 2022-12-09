import ast
from redbaron import RedBaron, redbaron

from typing import Tuple

_FAKE_TYPE = '_hole_'
_PLACEHOLDER_TYPE = '_placeholder_'


def _get_comment_count(source_file: RedBaron) -> int:
    return len(source_file.find_all('CommentNode'))

def _handle_func(func) -> None:
    _handle_arguments(func)
    _handle_return(func)

def _handle_arguments(func) -> None:
    for arg in func.arguments:
        if arg.target.value != 'self':
            arg.annotation = _PLACEHOLDER_TYPE

def _handle_return(func) -> None:
    func.return_annotation = _PLACEHOLDER_TYPE

def _handle_assignment(a) -> None:
    # TODO: find better way to check this
    if not isinstance(a.target, redbaron.nodes.TupleNode) and a.operator == '':
        a.annotation = _PLACEHOLDER_TYPE

def _handle_source(source: RedBaron, should_handle_assignments: bool) -> None:
    funcs = source.find_all('DefNode')
    for func in funcs:
        _handle_func(func)
    if should_handle_assignments:
        assignments = source.find_all('AssignmentNode')
        for a in assignments:
            _handle_assignment(a)

def _strip_types(source_file: RedBaron, should_handle_assignments: bool) -> ast.AST:
    _handle_source(source_file, should_handle_assignments)
    return ast.parse(source_file.dumps())

def _count_nodes(source_file: RedBaron, should_handle_assignments: bool) -> int:
    ast_without_comments = _strip_types(source_file, should_handle_assignments)
    count = 1
    for _ in ast.walk(ast_without_comments):
        count += 1
    return count

def check_completed(original_ast: RedBaron, completed_ast: RedBaron, should_handle_assignments: bool = False) -> Tuple[bool, int]:
    is_completed: bool = True
    score: int = 0

    completed_funcs = completed_ast.find_all('DefNode')
    for func in completed_funcs:
        for arg in func.arguments:
            if arg.target.value == 'self':
                continue
            elif arg.annotation.value == _FAKE_TYPE:
                is_completed = False
            elif arg.annotation.value == 'Any':
                score += 5
        if func.return_annotation.value is None:
            return False, score
        elif func.return_annotation.value == 'Any':
            score += 5

    if not is_completed:
        return False, score

    original_comments = _get_comment_count(original_ast)
    completed_commments = _get_comment_count(completed_ast)

    if original_comments != completed_commments:
        return False, score

    original_count = _count_nodes(original_ast, should_handle_assignments)
    completed_count = _count_nodes(completed_ast, should_handle_assignments)

    return original_count == completed_count, score


""" Test
if __name__ == '__main__':
    with open('./__example.py', 'r') as f_orig:
        original_ast = RedBaron(f_orig.read())
    with open('./__example_typed.py', 'r') as f_comp:
        completed_ast = RedBaron(f_comp.read())
    status, score = check_completed(original_ast, completed_ast)
    print(status, score)
"""
