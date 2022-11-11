import ast
import copy
from astor import to_source

from typing import Tuple

_FAKE_TYPE = '_hole_'


# TODO: implement
def get_comments(source_file: ast.AST) -> int:
    return 0

# TODO: implement
def strip_types(source_file: ast.AST) -> ast.AST:
    return ast.AST()

def count_nodes(child: ast.AST) -> int:
    count = 1
    for c in ast.walk(child):
        count += count_nodes(c)
    return count

def check_completed(original: ast.AST, completed: ast.AST) -> Tuple[bool, int]:
    is_completed: bool = True
    score: int = 0

    for child in ast.walk(completed):
        if isinstance(child, ast.arg):
            annotation_str = to_source(child.annotation)
            if _FAKE_TYPE in annotation_str:
                is_completed = False
            elif 'Any' in annotation_str:
                score += 5

    if not is_completed:
        return False, score

    original_copy = copy.deepcopy(original)
    completed_copy = copy.deepcopy(completed)

    original_comments = get_comments(original_copy)
    completed_commments = get_comments(completed_copy)

    if original_comments != completed_commments:
        return False, score

    original_stripped = strip_types(original_copy)
    completed_stripped = strip_types(original_copy)

    original_count = count_nodes(original_stripped)
    completed_count = count_nodes(completed_stripped)

    return original_count == completed_count, score
