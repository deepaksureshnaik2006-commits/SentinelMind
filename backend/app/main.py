import os
import sys
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Ensure both backend and project root are in sys.path
current_file = Path(__file__).resolve()
backend_dir = current_file.parent.parent
project_root = backend_dir.parent
for p in [str(backend_dir), str(project_root)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.config import settings
    from app.routes import (
        incidents,
        logs,
        assistant,
        memory,
        recommendations,
        feedback,
        analytics,
        simulator,
        services,
        settings as settings_route
    )
except ImportError:
    from .config import settings
    from .routes import (
        incidents,
        logs,
        assistant,
        memory,
        recommendations,
        feedback,
        analytics,
        simulator,
        services,
        settings as settings_route
    )

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("sentinelmind")

app = FastAPI(
    title="SentinelMind API",
    description="Self-Learning AI Incident Response Agent Powered by Hindsight Memory and Groq LLM",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(incidents.router)
app.include_router(logs.router)
app.include_router(assistant.router)
app.include_router(memory.router)
app.include_router(recommendations.router)
app.include_router(feedback.router)
app.include_router(analytics.router)
app.include_router(simulator.router)
app.include_router(services.router)
app.include_router(settings_route.router)

@app.get("/api")
def api_root():
    return {
        "name": "SentinelMind API",
        "tagline": "An AI Agent That Learns From Every Incident",
        "status": "operational",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "hindsight_bank": settings.HINDSIGHT_BANK_ID,
        "groq_model": settings.GROQ_MODEL
    }

# Mount frontend production dist if built
dist_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if dist_path.exists():
    app.mount("/", StaticFiles(directory=str(dist_path), html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "name": "SentinelMind API",
            "tagline": "An AI Agent That Learns From Every Incident",
            "status": "operational",
            "version": "1.0.0",
            "docs_url": "/docs"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)

