.PHONY: build shell down reset demo

build:
	docker compose up -d --build

shell:
	docker compose exec db psql -U logistica

down:
	docker compose down

reset:
	docker compose down -v
	docker compose up -d --build

demo:
	docker compose exec -T db psql -U logistica < db/datos-demo.sql
