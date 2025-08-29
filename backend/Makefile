.PHONY: up down logs api worker scheduler test fmt lint
up:        ; docker-compose -f deploy/docker-compose.yml up -d --build
down:      ; docker-compose -f deploy/docker-compose.yml down -v
logs:      ; docker-compose -f deploy/docker-compose.yml logs -f --tail=200
api:       ; docker-compose -f deploy/docker-compose.yml exec api uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
worker:    ; docker-compose -f deploy/docker-compose.yml exec worker python -m dramatiq src.tasks.run_start
scheduler: ; docker-compose -f deploy/docker-compose.yml exec scheduler python src/scheduler.py
test:      ; docker-compose -f deploy/docker-compose.yml exec api pytest -q || true
