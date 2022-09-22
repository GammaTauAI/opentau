import os
import shutil
import random


_OLD_W_C = '../js_testfiles'
_OLD_WO_C = '../js_testfiles_nc'
_NEW_W_C = '../js_100'
_NEW_WO_C = '../js_100_nc'

def main() -> None:
    idxs = random.sample(range(0, 1800), 100)
    for i in idxs:
        shutil.copy(os.path.join(_OLD_W_C, f'{i}.js'), _NEW_W_C)
        shutil.copy(os.path.join(_OLD_WO_C, f'{i}-nc.js'), _NEW_WO_C)
    print('done') 

if __name__ == '__main__':
    main()
