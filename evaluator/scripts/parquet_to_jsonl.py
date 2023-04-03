import pandas as pd
import os
import argparse

# usage: ./converter.py --help

def parquet2jsonl(filename):
    df = pd.read_parquet(f'{filename}.parquet')
    df.to_json(f'{filename}.jsonl', orient='records', lines=True)
    
    
def convert(args): 
    filename = os.path.splitext(args.sourcefile)[0]
    parquet2jsonl(filename)
    
    
def main():
    parser = argparse.ArgumentParser(description="Convert parquet to jsonl")
    parser.add_argument("sourcefile")
    parser.set_defaults(func=convert)
    args = parser.parse_args()
    args.func(args)
    
    
if __name__ == "__main__":
    main()
