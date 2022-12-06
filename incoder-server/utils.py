from typing import List, Set, Tuple


def input_to_infill_format(s: str, placeholder: str = '_hole_') -> List[str]:
    """Splits an input by fake type"""
    return s.split(placeholder)

def _remove_punc(s: str) -> str:
    return ''.join(e for e in s if e.isalnum())

def remove_dupl(res: List[str]) -> Set[str]:
    """Removes duplicates from a list of strings"""
    return set(res)

def compose_response(res: dict) -> str:
    """Removes comma after completion if needed"""
    s = ''
    for i, infill in enumerate(res['infills']):
        infill = _remove_punc(infill)
        s += f'{res["parts"][i]}{infill}'
    s += res["parts"][-1]
    return s
