# Backend (FastAPI + Dramatiq)

## Folders
- `apps/api/src/auth` — login/verify/refresh
- `apps/api/src/workflows` — CRUD + run
- `apps/api/src/runs` — status/logs
- `apps/api/src/ingest` — file upload/fetch
- `apps/api/src/rag` — index/query
- `apps/api/src/actions` — Slack/Sheets/Email/Notion/Twilio
- `apps/worker/src/tasks` — ingest/ai/actions/default actors
- `apps/worker/src/broker.py` — Redis broker + middlewares

## Endpoints (MVP)
- Auth: `/auth/login`, `/auth/verify`, `/auth/refresh`
- Workflows: `POST/GET/PUT /workflows`, `POST /workflows/:id/run`
- Runs: `GET /runs/:id`, `GET /runs/:id/logs`
- Ingest: `POST /ingest/upload`, `POST /ingest/fetch`
- RAG: `POST /rag/index`, `POST /rag/query`
- Actions: `POST /actions/*` per integration

## Queue Design
- Retries (exp backoff); AgeLimit; rate limits for third-party APIs.

## Data Models (Mongo)
- `workflows`, `runs`, `run_logs`, `datasets`, `documents`, `users`.

## Adding a New Node Type
1. Register spec (inputs/outputs/config schema) in a node registry module.
2. Implement `run(ctx)` actor (idempotent).
3. Add validator + action endpoint if it’s an external integration.
4. Expose node type in frontend palette and inspector form.
