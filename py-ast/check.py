import ast
import copy
from redbaron import RedBaron

from typing import Tuple

_FAKE_TYPE = '_hole_'


def get_comment_count(source_file: RedBaron) -> int:
    return len(source_file.find_all('CommentNode'))

def strip_types(source_file: RedBaron) -> ast.AST:
    return ast.parse(source_file.dumps())

# FIXME: recursion depth error
def count_nodes(source_file: RedBaron) -> int:
    ast_without_comments = strip_types(source_file)
    count = 1
    for _ in ast.walk(ast_without_comments):
        count += 1
    return count

# FIXME: recursion depth error
def check_completed(original_ast: RedBaron, completed_ast: RedBaron) -> Tuple[bool, int]:
    is_completed: bool = True
    score: int = 0

    completed_funcs = completed_ast.find_all('DefNode')
    for func in completed_funcs:
        for arg in func.arguments:
            if arg.annotation == _FAKE_TYPE:
                is_completed = False
            elif arg.annotation == 'Any':
                score += 5

    if not is_completed:
        return False, score

    original_comments = get_comment_count(original_ast)
    completed_commments = get_comment_count(completed_ast)

    if original_comments != completed_commments:
        return False, score

    original_count = count_nodes(original_ast)
    completed_count = count_nodes(completed_ast)
    print(f'original count: {original_count}')
    print(f'completed count: {completed_count}')

    return original_count == completed_count, score


if __name__ == '__main__':
    with open('./temp.py', 'r') as f_orig:
        original_ast = RedBaron(f_orig.read())
    with open('./temp_no_types.py', 'r') as f_comp:
        completed_ast = RedBaron(f_comp.read())
    status, score = check_completed(original_ast, completed_ast)
    # print(status, score)
