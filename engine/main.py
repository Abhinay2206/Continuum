# pyrefly: ignore [missing-import]
import uvicorn
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from api.routers import repositories, chat, agents
from services.database_service import database_service
from services.cache_service import cache_service
from metrics import metrics

app = FastAPI(
    title=settings.app_name,
    description="Continuum Repository Intelligence Service",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    await database_service.connect()
    cache_service.connect(settings.redis_url, ttl=settings.cache_ttl_seconds)


@app.on_event("shutdown")
async def shutdown_event():
    await database_service.close()


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "cache_enabled": cache_service.enabled,
    }


@app.get("/metrics")
def get_metrics():
    """Operational metrics: latency, token estimates, cache hit rate."""
    return metrics.summary()


app.include_router(repositories.router, prefix="/repositories", tags=["Repositories"])
app.include_router(chat.router, tags=["Chat"])
app.include_router(agents.router, tags=["Agents"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.debug)
