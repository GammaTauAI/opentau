import requests

ENDPOINT = 'http://localhost:8000'

with open('./test.ts') as f:
    input = f.read()
    n = 10
    temperature = 0.8
    res = requests.post(ENDPOINT, json={
        "input": input,
        "n": n,
        "temperature": temperature,
    })
    print(res.json())
