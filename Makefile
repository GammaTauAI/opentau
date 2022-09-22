FULLPATH := $(shell pwd)

all:
	cd ./ts-ast/ && npm install && cd ../; \
	cd ./client/ && cargo build --release && ln -s $(FULLPATH)/client/target/release/main $(FULLPATH)/out/client && cd ../;
