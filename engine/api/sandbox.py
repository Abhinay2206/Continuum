from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from workspaces.sandbox_manager import sandbox_manager
from services.ingestion_service import ingestion_service
from services.database_service import database_service

router = APIRouter()


class SandboxCreateRequest(BaseModel):
    repo_id: str
    repo_path: str = ""
    github_url: str = ""


@router.post("/create")
async def create_sandbox(request: SandboxCreateRequest):
    if not sandbox_manager.available:
        raise HTTPException(
            status_code=503,
            detail="Docker is not available. Start Docker Desktop to use the workspace terminal.",
        )

    # Materialize the repository on disk. The scanner deletes the clone after
    # indexing, so the workspace re-clones from the stored GitHub URL on demand.
    repo_path = request.repo_path
    if not repo_path:
        github_url = request.github_url
        if not github_url:
            info = await database_service.get_repository_clone_info(request.repo_id)
            github_url = info["url"] if info else None
        repo_path = ingestion_service.ensure_repository(request.repo_id, github_url)

    if not repo_path:
        raise HTTPException(
            status_code=404,
            detail="Repository source is unavailable and could not be cloned for the workspace.",
        )

    success = sandbox_manager.create_sandbox(request.repo_id, repo_path)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to create sandbox. Is Docker running?")
    return {"status": "success", "message": "Sandbox created", "repo_path": repo_path}


@router.post("/{repo_id}/stop")
async def stop_sandbox(repo_id: str):
    sandbox_manager.stop_sandbox(repo_id)
    # Reclaim disk: the on-demand workspace clone is no longer needed once the
    # sandbox is torn down. Indexed vectors in Qdrant are untouched.
    ingestion_service.delete_repository(repo_id)
    return {"status": "success", "message": "Sandbox stopped"}


@router.get("/{repo_id}/status")
async def sandbox_status(repo_id: str):
    container = sandbox_manager.get_container(repo_id)
    if container:
        return {"status": container.status}
    return {"status": "not_found"}
