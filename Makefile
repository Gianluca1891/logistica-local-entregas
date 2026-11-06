.PHONY: build shell down

build:
	docker compose up -d --build

shell:
	docker compose exec db psql -U logistica

down:
	docker compose down
