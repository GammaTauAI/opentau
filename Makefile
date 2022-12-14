FULLPATH := $(shell pwd)

all: build-release

build-debug: clean
	cd ./ts-ast/ && npm install && cd ../; \
	cd ./client/ && cargo build && ln -s $(FULLPATH)/client/target/debug/main $(FULLPATH)/out/client-debug && cd ../;

build-release: clean
	cd ./ts-ast/ && npm install && cd ../; \
	cd ./client/ && cargo build --release && ln -s $(FULLPATH)/client/target/release/main $(FULLPATH)/out/client && cd ../;

clean:
	rm -f ./out/client; \
	rm -f ./out/client-debug; \
	rm -rf ./ts-ast/node_modules; \
