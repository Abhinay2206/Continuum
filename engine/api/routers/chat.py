# pyrefly: ignore [missing-import]
from fastapi import APIRouter
from core.models import ChatRequest, ChatResponse, SearchRequest, SearchResult
from services.qdrant_service import qdrant_service
from services.embedding_service import embedding_service
from groq import Groq
from core.config import settings

router = APIRouter()
groq_client = Groq(api_key=settings.groq_api_key)

@router.post("/search")
async def search(request: SearchRequest):
    query_vector = embedding_service.generate_embedding(request.query)
    results = qdrant_service.search(request.repoId, query_vector, limit=request.limit)
    
    formatted_results = []
    for hit in results:
        formatted_results.append({
            "filePath": hit.payload.get("filePath"),
            "language": hit.payload.get("language"),
            "chunk": hit.payload.get("chunk"),
            "score": hit.score
        })
        
    return {"results": formatted_results}

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # 1. Embed the question (still uses OpenAI embeddings)
    question_vector = embedding_service.generate_embedding(request.question)
    
    # 2. Retrieve Context
    search_results = qdrant_service.search(request.repoId, question_vector, limit=8)
    
    context_blocks = []
    sources = set()
    
    for hit in search_results:
        payload = hit.payload
        file_path = payload.get("filePath")
        chunk = payload.get("chunk")
        context_blocks.append(f"File: {file_path}\nCode:\n```\n{chunk}\n```")
        sources.add(file_path)
        
    context_str = "\n\n".join(context_blocks)
    
    # 3. Build Prompt
    system_prompt = (
        "You are Continuum, an expert AI software engineer. "
        "Answer the user's question about their codebase using the provided context. "
        "If the answer is not contained within the context, say you don't know based on the current context."
    )
    
    user_prompt = f"Context:\n{context_str}\n\nQuestion: {request.question}"
    
    # 4. LLM Generation using Groq
    response = groq_client.chat.completions.create(
        model=settings.chat_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.2
    )
    
    answer = response.choices[0].message.content
    
    return {
        "answer": answer,
        "sources": list(sources)
    }
