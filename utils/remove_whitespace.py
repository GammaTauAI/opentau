import os

_DIR = 'js_testfiles'

def remove() -> None:
    d = os.fsencode(_DIR)
    for i, file in enumerate(os.listdir(d)):
        filename = os.fsdecode(file)
        remove_whitespace(filename, i)

def remove_whitespace(f: str, i: int) -> None:
    f = os.path.join(_DIR, f)
    write_f = f.replace('.js', '-nc.js')
    with open(f,'r') as read_file:
        with open(write_f, 'a') as write_file:
            for line in read_file.readlines():
                if not line.isspace():
                    if '//' in line:
                        line = line.split('//')[0]
                    write_file.write(line.replace('^M', ''))
    print(f'processing {f}')

if __name__ == '__main__':
    remove()
    print('done!')
