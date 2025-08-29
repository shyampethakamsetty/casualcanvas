# Operations Runbook

## Start/Stop/Logs
```bash
make up
make logs
docker compose -f deploy/docker-compose.yml ps
```

## Health
- API: `/healthz`
- Metrics: `/metrics`
- Grafana dashboards: latency, errors, queue depth, RAG latency.

## Backups
- Mongo: nightly dump, weekly off-box.
- Qdrant: snapshot collections directory.
- Restore drill quarterly.

## Common Issues
- 401: Check JWT clock skew and refresh flow.
- 429/5xx from integrations: observe retries & rate limits.
- Slow RAG: increase Qdrant pods, tune vector params, cache embeddings.
