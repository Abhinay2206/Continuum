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
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    chat_model: str = "meta-llama/llama-4-scout-17b-16e-instruct"
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384  # Dimension for all-MiniLM-L6-v2

    # Workspace Config
    workspace_dir: str = os.path.join(os.getcwd(), "workspaces")

    # Redis Cache (optional — set to empty string to disable)
    redis_url: str = os.getenv("REDIS_URL", "")
    cache_ttl_seconds: int = 3600  # 1 hour per agent result

    # Agent token budget
    # ~5 000 tokens of code context per agent (leaves room for system prompt +
    # model output inside an 8 K context window).
    max_context_chars_per_agent: int = 20_000   # 5 000 tokens × 4 chars/token
    max_chunks_per_agent: int = 10
    agent_timeout_seconds: int = 60

    class Config:
        env_file = ".env"

settings = Settings()
