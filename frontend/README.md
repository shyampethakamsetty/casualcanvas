# Frontend Scaffold — AI Workflow Builder (Next.js + Tailwind + React Flow)

## Quickstart
```bash
cd apps/web
cp .env.example .env
npm install
npm run dev
# open http://localhost:3001
```

Set `NEXT_PUBLIC_API_BASE` to your API (default http://localhost:8000).

## What’s included
- App Router structure: `/` (list), `/login`, `/workflows/[id]` (editor)
- Components: NodePalette, Canvas (React Flow), Inspector, RunPanel
- API client with token header (dev)
- Dockerfile for containerized deploy
```
