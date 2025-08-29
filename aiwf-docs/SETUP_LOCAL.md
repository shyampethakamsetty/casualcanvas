# Local Setup (Dev)
## Prereqs
- Docker/Docker Compose, Node 20+, Python 3.11+

## Backend
```bash
cd ai-workflow-builder
cp .env.example .env
make up
# API: http://localhost:8000/healthz
```

## Frontend
```bash
cd ai-workflow-builder-frontend/apps/web
cp .env.example .env
# set NEXT_PUBLIC_API_BASE=http://localhost:8000
npm install
npm run dev
# Web: http://localhost:3001
```

## CORS
Dev is permissive. For prod, lock CORS down to your domains in the API.

## Smoke Test
1. Create workflow (frontend Save or cURL `POST /workflows`).
2. Click **Run** (or cURL `POST /workflows/:id/run`).
3. Check status at `/runs/:run_id` and logs at `/runs/:run_id/logs`.
