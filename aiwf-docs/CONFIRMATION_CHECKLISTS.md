# Confirmation Checklists (Gates)

## Gate A — Environment Ready
- [ ] Backend `.env` filled (Mongo/Redis/Qdrant/OpenAI/integrations)
- [ ] Frontend `.env` points to API base

## Gate B — Services Up
- [ ] `make up` succeeds; API `/healthz` OK
- [ ] Web page loads

## Gate C — First Workflow
- [ ] Create workflow in UI and save
- [ ] Run workflow; status transitions; logs visible

## Gate D — RAG
- [ ] Upload/Index PDF; `/rag/query` returns citations

## Gate E — Integrations
- [ ] Slack + Email tested; then Sheets/Notion/Twilio

## Gate F — Scheduling & Metrics
- [ ] Cron @ 09:00 IST fires
- [ ] Grafana shows p95/error% within targets
