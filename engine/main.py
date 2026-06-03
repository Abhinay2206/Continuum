# pyrefly: ignore [missing-import]
import uvicorn
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from api.routers import repositories, chat
from services.database_service import database_service

app = FastAPI(
    title=settings.app_name,
    description="Continuum Repository Intelligence Service",
    version="1.0.0"
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

@app.on_event("shutdown")
async def shutdown_event():
    await database_service.close()

@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(repositories.router, prefix="/repositories", tags=["Repositories"])
app.include_router(chat.router, tags=["Chat"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.debug)
