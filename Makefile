.PHONY: dev web api firebase firebase-test firebase-seed install lint test format

install:
	npm install
	python3 -m venv .venv
	.venv/bin/pip install -e "apps/api[dev]"

dev:
	@echo "Run 'make web' and 'make api' in separate terminals."

web:
	npm run dev

api:
	.venv/bin/uvicorn app.main:app --reload --app-dir apps/api

firebase:
	npm run firebase:emulators

firebase-test:
	npm run firebase:validate-seed
	npm run firebase:test-rules

firebase-seed:
	npm run firebase:seed-emulator

lint:
	npm run lint
	.venv/bin/ruff check apps/api
	.venv/bin/ruff format --check apps/api

test:
	npm run test
	.venv/bin/pytest apps/api/app/tests

format:
	npm run format
	.venv/bin/ruff check --fix apps/api
	.venv/bin/ruff format apps/api
