# Testing & QA
See Step 8 plan condensed for hands-on:

## E2E Scenarios
1) Daily Digest: URL → Summarize → Slack + Email.
2) RAG Q&A: PDF → Index → Query (citations) → Notion.
3) Scheduled Report: 09:00 IST cron.
4) Retry test: induce 429 and verify backoff.

## Performance Targets (MVP)
- API p95 < 300 ms (CRUD/status)
- RAG query p95 < 1.5 s (cached)
- 20-page PDF index < 60 s (cold)

## Tools
- Backend: `pytest`
- E2E: Playwright
- Load: Locust/k6
- Metrics: Grafana
