import os

_DIR = 'leetcode-js'
_WRITE_DIR = 'js_testfiles'


def remove() -> None:
    d = os.fsencode(_DIR)
    for i, file in enumerate(os.listdir(d)):
        filename = os.fsdecode(file)
        remove_comments(filename, i)

def remove_comments(f: str, i: int) -> None:
    f = os.path.join(_DIR, f)
    os.system(f'cpp -undef -P {f} > {os.path.join(_WRITE_DIR, str(i))}.js')
    print(f'processing {f}')

if __name__ == '__main__':
    remove()
    print('done!')
