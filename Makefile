.PHONY: build shell down reset

build:
	docker compose up -d --build

shell:
	docker compose exec db psql -U logistica

down:
	docker compose down

reset:
	docker compose down -v
	docker compose up -d --build