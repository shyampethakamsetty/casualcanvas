# Project Overview
The AI Workflow Builder is a **no-code automation platform** to compose AI pipelines: ingest data (PDF/URL/webhook), run AI nodes (RAG Q&A, summarize, classify), and trigger actions (Slack, Sheets, Email, Notion, Twilio).

## High-level Goals
- Visual workflow canvas to connect nodes and configure steps.
- Execution engine with **retries, scheduling, and logs**.
- Production-grade **RAG** using **Qdrant** for embeddings.
- 5 integrations for MVP: Slack, Google Sheets, Email/SMTP, Notion, Twilio.

## Codebases Delivered
- **Backend (Python/FastAPI + Dramatiq + Mongo + Redis + Qdrant)** — exposes REST APIs and executes workflows.
- **Frontend (Next.js + Tailwind + React Flow)** — visual builder UI that calls backend APIs.

## Ports (default)
- API: `http://localhost:8000`
- Web: `http://localhost:3001`

## Key Environment Variables
- Frontend: `NEXT_PUBLIC_API_BASE` → base URL for the backend.
- Backend: `MONGO_URL`, `REDIS_URL`, `QDRANT_URL`, `OPENAI_API_KEY`, and integration secrets.
