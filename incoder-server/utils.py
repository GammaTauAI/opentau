from typing import List


def input_to_infill_format(s: str, placeholder: str = '_hole_') -> List[str]:
    """Splits an input by fake type"""
    return s.split(placeholder)

def compose_response(res: dict) -> str:
    """Removes comma after completion if needed"""
    s = ''
    for i, infill in enumerate(res['infills']):
        if infill.endswith(','):
            infill = infill[:-1]
        s += f'{res["parts"][i]}{infill}'
    s += res["parts"][-1]
    return s
