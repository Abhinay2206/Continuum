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
    embedding_dimension: int = 384 # Dimension for all-MiniLM-L6-v2
    
    # Workspace Config
    workspace_dir: str = os.path.join(os.getcwd(), "workspaces")

    class Config:
        env_file = ".env"

settings = Settings()
