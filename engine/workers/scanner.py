"""Background scanner worker — clones, chunks, embeds, indexes, then runs agents."""
import asyncio
import traceback
import uuid

from services.ingestion_service import ingestion_service
from services.chunking_service import chunking_service
from services.embedding_service import embedding_service
from services.qdrant_service import qdrant_service
from services.database_service import database_service
from services.cache_service import cache_service


class ScannerWorker:

    async def process_repository(self, github_url: str, repo_id: str):
        try:
            # 1. Clone
            await database_service.update_repository_status(
                repo_id, "running", log="Starting clone..."
            )
            ingestion_service.clone_repository(github_url, repo_id)

            # 2. Parse
            await database_service.update_repository_status(
                repo_id, "running", log="Parsing files..."
            )
            files_data = ingestion_service.traverse_repository(repo_id)

            # 3. Chunk
            await database_service.update_repository_status(
                repo_id, "running", log="Chunking code..."
            )
            chunks = chunking_service.chunk_repository_files(repo_id, files_data)

            if not chunks:
                await database_service.update_repository_status(
                    repo_id, "completed", log="No valid code files found."
                )
                return

            # 4. Embed
            await database_service.update_repository_status(
                repo_id, "running", log="Generating embeddings..."
            )
            loop = asyncio.get_event_loop()
            texts = [c["chunk"] for c in chunks]
            embeddings = await loop.run_in_executor(
                None, embedding_service.generate_embeddings, texts
            )

            # 5. Store in Qdrant
            await database_service.update_repository_status(
                repo_id, "running", log="Storing in vector database..."
            )
            ids = [
                str(uuid.uuid5(uuid.NAMESPACE_URL, c["chunkId"])) for c in chunks
            ]
            await loop.run_in_executor(
                None, qdrant_service.upsert_chunks, embeddings, chunks, ids
            )

            # 6. Invalidate any stale cached analysis for this repo
            cache_service.invalidate_repo(repo_id)

            # 7. Mark ready — onboarding UI can show ReadyScreen
            await database_service.update_repository_status(
                repo_id, "completed", log="Indexing completed. Running analysis..."
            )

            # 8. Run agents in background (non-blocking)
            asyncio.ensure_future(self._run_agents(repo_id))

        except Exception as e:
            error_trace = traceback.format_exc()
            print(f"Error processing {repo_id}: {error_trace}")
            await database_service.update_repository_status(
                repo_id, "failed", log=f"Error: {str(e)}"
            )
            raise
        finally:
            try:
                ingestion_service.delete_repository(repo_id)
            except Exception:
                pass

    async def _run_agents(self, repo_id: str):
        """
        Run the full health-scan agent suite after indexing.

        Uses the new orchestrator which:
        - classifies intent (no LLM)
        - retrieves shared context once in parallel
        - runs agents concurrently with asyncio.gather
        - caches results so subsequent API calls are instant
        """
        try:
            from orchestrator.orchestrator import orchestrator
            from orchestrator.action_engine import action_engine

            print(f"[Agents] Starting analysis for repo {repo_id}")
            raw = await orchestrator.run(
                repo_id,
                "Full repository analysis: bugs, security, architecture, code review, dependencies",
            )
            report = action_engine.aggregate(raw)
            await database_service.save_agent_results(repo_id, report)
            print(f"[Agents] Analysis completed for repo {repo_id}")
        except Exception as e:
            error_trace = traceback.format_exc()
            print(f"[Agents] Analysis failed for repo {repo_id}: {e}\n{error_trace}")
            # Reset status so the UI doesn't stay stuck on "running" forever
            try:
                await database_service.update_repository_status(
                    repo_id, "completed", log=f"Agent analysis failed: {str(e)}"
                )
            except Exception:
                pass


scanner_worker = ScannerWorker()
