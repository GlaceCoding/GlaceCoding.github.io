all: run

run:
	python3 -m http.server 8000

.PHONY: run
