import ast

_FAKE_ARG_ANNOTATION = '_hole_'
_FAKE_RETURN_ANNOTATION = ' _hole_'


# TODO: identifier declaration types
# TODO: async funcs
class Visitor(ast.NodeTransformer):
    def visit_arg(self, node: ast.arg) -> ast.arg:
        new_arg = ast.arg()
        new_arg.arg = node.arg
        if node.annotation is None:
            new_arg.annotation = _FAKE_ARG_ANNOTATION # type: ignore
        else:
            new_arg.annotation = node.annotation
        ast.copy_location(new_arg, node)
        return new_arg

    # TODO: don't overwrite existing types
    def visit_FunctionDef(self, node: ast.FunctionDef) -> ast.FunctionDef:
        new_func = ast.FunctionDef()
        new_func.decorator_list = node.decorator_list
        new_func.name = node.name
        new_func.args = node.args
        new_func.body = node.body
        new_func.returns =_FAKE_RETURN_ANNOTATION # type: ignore
        ast.NodeVisitor.generic_visit(self, new_func)
        return new_func

# TODO: identifier declaration types
# TODO: async funcs
def print_source(source_file: ast.AST) -> str:
    node_visitor = Visitor()
    for c in ast.walk(source_file):
        if isinstance(c, ast.FunctionDef):
            c = node_visitor.visit(c)
    return ast.unparse(source_file)


if __name__ == '__main__':
    with open('./temp.py', 'r') as f:
        source_file = ast.parse(f.read())
        res = print_source(source_file)
        print(res)

