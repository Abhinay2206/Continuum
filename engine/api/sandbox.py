from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from workspaces.sandbox_manager import sandbox_manager
from services.ingestion_service import ingestion_service

router = APIRouter()

class SandboxCreateRequest(BaseModel):
    repo_id: str
    repo_path: str = ""

@router.post("/create")
async def create_sandbox(request: SandboxCreateRequest):
    repo_path = request.repo_path or ingestion_service.get_repo_path(request.repo_id)
    success = sandbox_manager.create_sandbox(request.repo_id, repo_path)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to create sandbox. Is Docker running?")
    return {"status": "success", "message": "Sandbox created"}

@router.post("/{repo_id}/stop")
async def stop_sandbox(repo_id: str):
    sandbox_manager.stop_sandbox(repo_id)
    return {"status": "success", "message": "Sandbox stopped"}

@router.get("/{repo_id}/status")
async def sandbox_status(repo_id: str):
    container = sandbox_manager.get_container(repo_id)
    if container:
        return {"status": container.status}
    return {"status": "not_found"}
