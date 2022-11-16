def do(a, b: int):
    # here 1
    res: int = a * b
    return res
def do_more(a: str, b: int):
    # here 2
    """here"""
    res = a * b
    return res
def do_more_more(a: str, b: int) -> str:
    # here 3
    res = a * b
    return res

class Person:
    def __init__(self, x: int) -> None:
        self.x = x 

    def do_something(self, y):
        return 5
