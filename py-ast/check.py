import ast
import copy
from comment_parser import comment_parser

from typing import Tuple

_FAKE_TYPE = '_hole_'


# TODO: implement
def get_comment_count(s: str) -> int:
    return len(comment_parser.extract_comments_from_str(s, mime='text/x-script.python'))

# TODO: implement
def strip_types(source_file: ast.AST) -> ast.AST:
    return ast.AST()

def count_nodes(child: ast.AST) -> int:
    count = 1
    for c in ast.walk(child):
        count += count_nodes(c)
    return count

def check_completed(original_ast: ast.AST, completed_ast: ast.AST, original_str: str, completed_str: str) -> Tuple[bool, int]:
    is_completed: bool = True
    score: int = 0

    for child in ast.walk(completed_ast):
        if isinstance(child, ast.arg):
            annotation_str = ast.unparse(child.annotation)
            if _FAKE_TYPE in annotation_str:
                is_completed = False
            elif 'Any' in annotation_str:
                score += 5

    if not is_completed:
        return False, score

    original_copy = copy.deepcopy(original_ast)
    completed_copy = copy.deepcopy(completed_ast)

    original_comments = get_comment_count(original_str)
    completed_commments = get_comment_count(completed_str)

    if original_comments != completed_commments:
        return False, score

    original_stripped = strip_types(original_copy)
    completed_stripped = strip_types(completed_copy)

    original_count = count_nodes(original_stripped)
    completed_count = count_nodes(completed_stripped)

    return original_count == completed_count, score

if __name__ == '__main__':
    with open('./temp.py', 'r') as f:
        res = get_comment_count(f.read())
        print(res)
