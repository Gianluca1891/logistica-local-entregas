.PHONY: build shell down reset demo logs

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
	docker compose exec -T redis redis-cli FLUSHALL

logs:
	docker compose logs -f api servicio-rutas
