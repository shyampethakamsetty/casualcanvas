import os
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from .database import Database
import dramatiq

app = FastAPI(title="AI Workflow Builder API", version="0.1.0")

# Configure Dramatiq broker - use the shared broker
from .shared_broker import redis_broker
dramatiq.set_broker(redis_broker)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3003", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Add prometheus instrumentation
Instrumentator().instrument(app).expose(app)

@app.on_event("startup")
async def startup_event():
    """Connect to database on startup"""
    await Database.connect_db()

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    await Database.close_db()

@app.get("/healthz")
def healthz():
    return {"ok": True}

# Routers
from .auth.router import router as auth_router
from .workflows.router import router as wf_router
from .runs.router import router as runs_router
from .ingest.router import router as ingest_router
from .rag.router import router as rag_router
from .actions.router import router as actions_router
from .nodes.router import router as nodes_router

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(wf_router,    prefix="/api/v1/workflows", tags=["workflows"])
app.include_router(runs_router,  prefix="/api/v1/runs", tags=["runs"])
app.include_router(ingest_router,prefix="/api/v1/ingest", tags=["ingest"])
app.include_router(rag_router,   prefix="/api/v1/rag", tags=["rag"])
app.include_router(actions_router,prefix="/api/v1/actions", tags=["actions"])
app.include_router(nodes_router, prefix="/api/v1/nodes", tags=["nodes"])
