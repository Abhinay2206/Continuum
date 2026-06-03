# pyrefly: ignore [missing-import]
from fastapi import APIRouter, BackgroundTasks, HTTPException
from core.models import ScanRequest, ScanResponse
from workers.scanner import scanner_worker
from services.qdrant_service import qdrant_service
from services.ingestion_service import ingestion_service

router = APIRouter()

@router.post("/scan", response_model=ScanResponse)
async def scan_repository(request: ScanRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        scanner_worker.process_repository, 
        request.githubUrl, 
        request.repoId
    )
    return {"repoId": request.repoId, "status": "pending"}

@router.post("/{repo_id}/reindex", response_model=ScanResponse)
async def reindex_repository(repo_id: str, request: ScanRequest, background_tasks: BackgroundTasks):
    # Same as scan, but you might clear old vectors first
    qdrant_service.delete_repository(repo_id)
    background_tasks.add_task(
        scanner_worker.process_repository, 
        request.githubUrl, 
        repo_id
    )
    return {"repoId": repo_id, "status": "pending"}

@router.post("/{repo_id}/reanalyze", response_model=ScanResponse)
async def reanalyze_repository(repo_id: str, background_tasks: BackgroundTasks):
    from services.database_service import database_service
    # Only append a log line — don't reset status so existing agentResults stay visible
    await database_service.update_repository_status(repo_id, "completed", log="Re-analysis triggered...")
    background_tasks.add_task(
        scanner_worker._run_agents,
        repo_id
    )
    return {"repoId": repo_id, "status": "running"}

@router.delete("/{repo_id}")
async def delete_repository(repo_id: str):
    # Cleanup vectors and clone
    qdrant_service.delete_repository(repo_id)
    ingestion_service.delete_repository(repo_id)
    return {"status": "deleted"}
