import os
# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API & App Settings
    app_name: str = "Continuum Engine"
    debug: bool = True

    # Qdrant Database
    qdrant_url: str = os.getenv("QDRANT_URL", "localhost")
    qdrant_api_key: str = os.getenv("QDRANT_API_KEY", "")
    qdrant_collection_name: str = "continuum_repository_chunks"

    # Postgres Database (Used by Next.js Backend)
    database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/continuum")

    # LLM Settings
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    chat_model: str = "gemini-2.5-flash"
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384  # Dimension for all-MiniLM-L6-v2

    # Workspace Config — anchored to the engine directory, not the shell CWD.
    workspace_dir: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "workspaces")

    # Redis Cache (optional — set to empty string to disable)
    redis_url: str = os.getenv("REDIS_URL", "")
    cache_ttl_seconds: int = 3600  # 1 hour per agent result

    # Agent token budget
    # ~5 000 tokens of code context per agent (leaves room for system prompt +
    # model output inside an 8 K context window).
    max_context_chars_per_agent: int = 20_000   # 5 000 tokens × 4 chars/token
    max_chunks_per_agent: int = 10
    agent_timeout_seconds: int = 60

    # ── Gemini 2.5 Flash token optimization ───────────────────────────────────
    # Per-agent retrieval caps. Never send more context than the question needs.
    # Dependency analysis works off parsed manifest metadata, so it needs only a
    # couple of chunks to locate the manifests.
    agent_chunk_limits: dict = {
        "docs": 5,
        "bug": 8,
        "security": 8,
        "architecture": 10,
        "review": 8,
        "dependency": 3,
    }

    # Per-agent output-token caps. Conservative by design — large outputs are
    # never requested unless the task explicitly demands them.
    agent_max_tokens: dict = {
        "bug": 1500,
        "security": 1500,
        "architecture": 1800,
        "review": 1500,
        "dependency": 1200,
        "docs": 1200,
    }

    # Non-agent call budgets
    intent_max_tokens: int = 256          # intent classification (if ever LLM-based)
    qa_max_tokens: int = 1024             # repository Q&A (chat router)
    health_report_max_tokens: int = 2000  # aggregated health report generation

    # Quality gate — findings below this confidence are rejected as speculation.
    min_confidence_threshold: int = 60

    class Config:
        env_file = ".env"

settings = Settings()
