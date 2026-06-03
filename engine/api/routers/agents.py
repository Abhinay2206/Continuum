"""
Agents API Router

POST /agents/run           — orchestrate relevant agents (intent → select → retrieve → analyse)
POST /agents/bug           — bug agent only
POST /agents/security      — security agent only
POST /agents/architecture  — architecture agent only
POST /agents/review        — code review agent only
POST /agents/dependencies  — dependency agent only
POST /agents/docs          — documentation agent only
POST /agents/readme        — generate README.md
POST /agents/explain       — explain a specific feature / flow
GET  /agents/              — list available agents
GET  /agents/metrics       — runtime observability metrics
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from orchestrator.orchestrator import orchestrator
from orchestrator.action_engine import action_engine
from agents.docs_agent.docs_agent import docs_agent
from metrics import metrics

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agents", tags=["Agents"])


# ── Request models ─────────────────────────────────────────────────────────────

class AgentRunRequest(BaseModel):
    repoId: str
    task: str = "Analyze repository"


class SingleAgentRequest(BaseModel):
    repoId: str
    task: Optional[str] = ""


class ExplainRequest(BaseModel):
    repoId: str
    topic: str


# ── Orchestrated multi-agent run ───────────────────────────────────────────────

@router.post("/run")
async def run_agents(request: AgentRunRequest):
    """
    Intent-classify the task, select the minimal agent set, retrieve shared
    context once, run agents in parallel, and return a unified health report.
    """
    try:
        raw = await orchestrator.run(request.repoId, request.task)
        return action_engine.aggregate(raw)
    except Exception as e:
        logger.exception("Orchestrator failed for repo %s", request.repoId)
        raise HTTPException(status_code=500, detail=str(e))


# ── Individual agent endpoints ─────────────────────────────────────────────────

@router.post("/bug")
async def run_bug_agent(request: SingleAgentRequest):
    try:
        return await orchestrator.run_single_agent("bug", request.repoId, request.task or "")
    except Exception as e:
        logger.exception("Bug agent failed for repo %s", request.repoId)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/security")
async def run_security_agent(request: SingleAgentRequest):
    try:
        return await orchestrator.run_single_agent("security", request.repoId, request.task or "")
    except Exception as e:
        logger.exception("Security agent failed for repo %s", request.repoId)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/architecture")
async def run_architecture_agent(request: SingleAgentRequest):
    try:
        return await orchestrator.run_single_agent("architecture", request.repoId, request.task or "")
    except Exception as e:
        logger.exception("Architecture agent failed for repo %s", request.repoId)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/review")
async def run_review_agent(request: SingleAgentRequest):
    try:
        return await orchestrator.run_single_agent("review", request.repoId, request.task or "")
    except Exception as e:
        logger.exception("Review agent failed for repo %s", request.repoId)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dependencies")
async def run_dependency_agent(request: SingleAgentRequest):
    try:
        return await orchestrator.run_single_agent("dependency", request.repoId, request.task or "")
    except Exception as e:
        logger.exception("Dependency agent failed for repo %s", request.repoId)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/docs")
async def run_docs_agent(request: SingleAgentRequest):
    try:
        return await orchestrator.run_single_agent("docs", request.repoId, request.task or "")
    except Exception as e:
        logger.exception("Docs agent failed for repo %s", request.repoId)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/readme")
async def generate_readme(request: SingleAgentRequest):
    try:
        return await docs_agent.generate_readme(request.repoId)
    except Exception as e:
        logger.exception("README generation failed for repo %s", request.repoId)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/explain")
async def explain_feature(request: ExplainRequest):
    """
    Explain a specific feature, flow, or component in the repository.
    Uses targeted retrieval (not the full orchestrator) for minimal token usage.
    """
    try:
        return await docs_agent.explain(request.repoId, request.topic)
    except Exception as e:
        logger.exception("Explain failed for repo %s", request.repoId)
        raise HTTPException(status_code=500, detail=str(e))


# ── Registry info ──────────────────────────────────────────────────────────────

@router.get("/")
async def list_agents():
    """List all registered agents and their API endpoints."""
    return {
        "agents": [
            {"name": "bug",          "description": "Runtime bugs, null refs, async misuse, memory leaks, N+1 queries"},
            {"name": "security",     "description": "Vulnerabilities, secret exposure, injection attacks, auth issues"},
            {"name": "architecture", "description": "Layer violations, coupling, SOLID, scalability blockers"},
            {"name": "review",       "description": "Code quality, naming, duplication, type safety, test coverage"},
            {"name": "dependency",   "description": "Vulnerable/outdated packages, unused deps, supply-chain risks"},
            {"name": "docs",         "description": "Documentation generation, README, feature explanations"},
        ],
        "endpoints": {
            "full_analysis":  "POST /agents/run",
            "bug":            "POST /agents/bug",
            "security":       "POST /agents/security",
            "architecture":   "POST /agents/architecture",
            "review":         "POST /agents/review",
            "dependencies":   "POST /agents/dependencies",
            "docs":           "POST /agents/docs",
            "readme":         "POST /agents/readme",
            "explain":        "POST /agents/explain",
            "metrics":        "GET  /agents/metrics",
        },
    }


@router.get("/metrics")
async def agent_metrics():
    """
    Runtime observability: per-agent latency, estimated token usage,
    cache hit rate, Qdrant search latency.
    """
    return metrics.summary()
