FULLPATH := $(shell pwd)

all: build-release

build-debug:
	cd ./ts-compiler/ && npm install && cd ../; \
	cd ./client/ && cargo build && ln -s $(FULLPATH)/client/target/debug/main $(FULLPATH)/out/client-debug && cd ../;

build-release:
	cd ./ts-compiler/ && npm install && cd ../; \
	cd ./client/ && cargo build --release && ln -s $(FULLPATH)/client/target/release/main $(FULLPATH)/out/client && cd ../;

clean:
	rm -f ./out/client; \
	rm -f ./out/client-debug; \
	rm -rf ./ts-compiler/node_modules; \


build-report:
	pandoc -f markdown+pipe_tables ./final_report.md -o final.pdf
