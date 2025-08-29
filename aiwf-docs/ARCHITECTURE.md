# Architecture

## Components
- **Web (Next.js)**: Builder UI, node palette, inspector, run panel.
- **API (FastAPI)**: Auth, workflow CRUD, run control, RAG endpoints, action endpoints.
- **Workers (Dramatiq)**: Execute runs and node tasks on Redis queues.
- **Scheduler**: Emits run jobs based on cron schedules.
- **MongoDB**: Workflows, runs, logs, datasets, documents.
- **Qdrant**: Vector store for embeddings and semantic search.
- **Redis**: Broker/cache for Dramatiq jobs.
- **Nginx**: Reverse proxy; TLS termination; routes web/API.

## Data Flow (read)
```
Browser (Next.js)
   │  HTTP
   ├── /api/v1/*  ──────────────▶  Nginx  ─────▶  FastAPI (API)
   │                                   │
   │                                   ├────▶ Redis (broker) ◀── Dramatiq Workers
   │                                   │           │
   │                                   │           ├──▶ MongoDB (workflows, runs, logs)
   │                                   │           └──▶ Qdrant (vectors)
   └── static assets  ───────────▶  Nginx  ─────▶  Web (Next.js)
```

## Sequence — Run a Workflow
1. Frontend calls `POST /api/v1/workflows/:id/run` with JWT.
2. API inserts a **run** (status `queued`), enqueues `run_start(run_id)` via Dramatiq.
3. `run_start` loads workflow, computes DAG, enqueues first ready node jobs.
4. Node actors (ingest/ai/actions) process, append **run_logs**, and enqueue downstream nodes.
5. When all nodes succeed, **run** is marked `succeeded` (or `failed` on error).
6. Frontend polls `GET /api/v1/runs/:run_id` and `GET /api/v1/runs/:run_id/logs` to render status/trace.

## Sequence — RAG Index & Query
1. Upload/fetch document → create `document` record.
2. Indexing task: chunk pages, embed, upsert points to **Qdrant** with metadata.
3. Query: Qdrant similarity search → assemble prompt with top-k chunks → LLM → answer + citations.

## Queues
- `ingest` — parse/index content
- `ai` — RAG queries and AI transforms
- `actions` — Slack/Email/Sheets/Notion/Twilio
- `default` — orchestration (run_start)

## Metrics (examples)
- `workflow_run_success_total`, `workflow_run_error_total`
- `workflow_run_latency_ms` (histogram)
- `node_retry_total`, `queue_depth`
- `rag_query_latency_ms`, `rag_cache_hit_ratio`
