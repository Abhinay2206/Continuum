from pydantic import BaseModel, HttpUrl
from typing import List, Optional

class ScanRequest(BaseModel):
    githubUrl: str
    repoId: str
    workspaceId: str

class ScanResponse(BaseModel):
    repoId: str
    status: str

class ChatRequest(BaseModel):
    repoId: str
    question: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]

class SearchRequest(BaseModel):
    repoId: str
    query: str
    limit: Optional[int] = 5

class SearchResult(BaseModel):
    filePath: str
    language: str
    chunk: str
    score: float
