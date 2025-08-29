# Production Deploy (Linux VPS)

## 1) Clone & Env
- Copy backend `.env.example` → `.env` and set secrets.
- Copy frontend `.env.example` → `.env` and set `NEXT_PUBLIC_API_BASE=https://YOUR_DOMAIN`.

## 2) Docker Compose
Add `web` service next to `api` in `deploy/docker-compose.yml`:
```yaml
  web:
    build: ./apps/web
    env_file: ../.env
    depends_on: [api]
    ports: ["3001:3001"]
```
*(In production, you can remove port 3001 exposure and use Nginx only.)*

## 3) Nginx Reverse Proxy (single domain)
Route `/api` to FastAPI, `/` to Next.js:
```
server {
  listen 80;
  server_name YOUR_DOMAIN;
  location /api/ {
    proxy_pass http://api:8000/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
  location / {
    proxy_pass http://web:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```
Update frontend `.env`:
```
NEXT_PUBLIC_API_BASE=https://YOUR_DOMAIN/api
```

## 4) TLS (Let’s Encrypt)
Use certbot or a companion container (e.g., nginx-proxy + acme). Ensure only 80/443 are public.

## 5) Health Checks
- `https://YOUR_DOMAIN/api/healthz` → `{"ok": true}`
- Open web at `https://YOUR_DOMAIN` and run a test workflow.

## 6) Scaling
- Increase `worker` replicas; fine-tune Redis; separate queues if needed.
