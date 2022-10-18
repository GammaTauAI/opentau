import ast
from astor import to_source

from typing import Union

_FAKE_TYPE = '_hole_'


def count_nodes(child: ast.AST) -> int:
    count = 1
    for c in ast.walk(child):
        count += count_nodes(c)
    return count

def check_completed(original: ast.AST, completed: ast.AST) -> Union[bool, int]:
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
        return False, score # type: ignore

    original_comments = ...
    completed_commments = ...

    if original_comments != completed_commments:
        return False, score # type: ignore
    
    original_stripped = ...
    completed_stripped = ...

    original_count = count_nodes(original_stripped) # type: ignore
    original_count = count_nodes(completed_stripped) # type: ignore

    return original_count == completed_count, score # type: ignore
