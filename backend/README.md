# AI Workflow Builder (MVP Scaffold)

Monorepo scaffold generated per project spec. Services: FastAPI API, Dramatiq workers, scheduler, MongoDB, Redis, Qdrant, Nginx, Prometheus, Grafana.

## Quickstart
1) Copy `.env.example` to `.env` and fill secrets.
2) Run:
```
make up
make logs
```
3) Visit API: http://localhost:8000/healthz
4) Prometheus: http://localhost:9090  | Grafana: http://localhost:3000

## Services
- apps/api — FastAPI HTTP API
- apps/worker — Dramatiq workers
- apps/scheduler — Cron emitter
- deploy — Docker Compose, Nginx, Prometheus, Grafana
