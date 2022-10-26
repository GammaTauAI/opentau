import subprocess

API = 'http://localhost:8000'

with open('./test.ts') as f:
    input = f.read()
    n = 1 
    temperature = 0.8
    for i in range(100):
        stdout = subprocess.run(['curl', '-d', f'temperature={temperature}&input={input}&retries={n}', 'http://localhost:8000']).stdout
        print(str(stdout))
