"""Shared RAG retrieval layer used by all agents."""
from services.qdrant_service import qdrant_service
from services.embedding_service import embedding_service


class RAGRetrieval:
    """Retrieve relevant code chunks from the vector store for a given query."""

    async def retrieve(
        self,
        repo_id: str,
        query: str,
        limit: int = 5,
    ) -> tuple[str, list[str]]:
        """
        Return (context_string, source_files) for the given query.
        context_string is pre-formatted for LLM injection.
        """
        query_vector = embedding_service.generate_embedding(query)
        results = qdrant_service.search(repo_id, query_vector, limit=limit)

        context_blocks = []
        sources = []

        for hit in results:
            payload = hit.payload
            file_path = payload.get("filePath", "unknown")
            language = payload.get("language", "")
            chunk = payload.get("chunk", "")

            context_blocks.append(
                f"File: {file_path}\n```{language}\n{chunk}\n```"
            )
            if file_path not in sources:
                sources.append(file_path)

        context_str = "\n\n".join(context_blocks)
        return context_str, sources

    async def retrieve_multi(
        self,
        repo_id: str,
        queries: list[str],
        limit_per_query: int = 3,
    ) -> tuple[str, list[str]]:
        """
        Retrieve context for multiple queries and deduplicate.
        Useful for agents that need broad coverage.
        """
        seen_chunks: set[str] = set()
        context_blocks: list[str] = []
        sources: list[str] = []

        for query in queries:
            query_vector = embedding_service.generate_embedding(query)
            results = qdrant_service.search(repo_id, query_vector, limit=limit_per_query)

            for hit in results:
                payload = hit.payload
                chunk = payload.get("chunk", "")
                if chunk in seen_chunks:
                    continue
                seen_chunks.add(chunk)

                file_path = payload.get("filePath", "unknown")
                language = payload.get("language", "")
                context_blocks.append(
                    f"File: {file_path}\n```{language}\n{chunk}\n```"
                )
                if file_path not in sources:
                    sources.append(file_path)

        return "\n\n".join(context_blocks), sources


rag_retrieval = RAGRetrieval()
