FULLPATH := $(shell pwd)

all: build-release

build-debug: clean-debug-link
	cd ./ts-compiler/ && npm install && cd ../; \
	cd ./client/ && cargo build && ln -s $(FULLPATH)/client/target/debug/main $(FULLPATH)/out/client-debug && cd ../;

build-release: clean-release-link
	cd ./ts-compiler/ && npm install && cd ../; \
	cd ./client/ && cargo build --release && ln -s $(FULLPATH)/client/target/release/main $(FULLPATH)/out/client && cd ../;

clean-release-link:
	rm -f ./out/client;

clean-debug-link:
	rm -f ./out/client-debug;

clean: clean-release-link clean-debug-link
	rm -rf ./ts-compiler/node_modules; \


build-report:
	pandoc -f markdown+pipe_tables ./final_report.md -o final.pdf
