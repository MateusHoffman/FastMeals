.PHONY: up verify verify-stack check-docs

up:
	cp -n .env.example .env 2>/dev/null || true
	docker compose up --build

verify:
	npm run verify

verify-stack:
	bash scripts/evaluator-verify.sh

check-docs:
	npm run check:docs
