# Security & Hardening (MVP)
- JWT access (15m) + refresh (7d) with rotation/blacklist.
- Strict Pydantic/Schema validation; size limits.
- Secrets via env only; log redaction.
- Per-route throttles; integration rate limits; exponential backoff.
- HTTPS + security headers via Nginx; CORS allow-list in prod.
- Mongo/Redis/Qdrant on private network; backups documented.
