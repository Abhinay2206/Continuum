import asyncio
import traceback
import uuid
from services.ingestion_service import ingestion_service
from services.chunking_service import chunking_service
from services.embedding_service import embedding_service
from services.qdrant_service import qdrant_service
from services.database_service import database_service

class ScannerWorker:
    async def process_repository(self, github_url: str, repo_id: str):
        try:
            # 1. Cloning
            await database_service.update_repository_status(repo_id, "running", log="Starting clone...")
            ingestion_service.clone_repository(github_url, repo_id)
            
            # 2. Parsing
            await database_service.update_repository_status(repo_id, "running", log="Parsing files...")
            files_data = ingestion_service.traverse_repository(repo_id)
            
            # 3. Chunking
            await database_service.update_repository_status(repo_id, "running", log="Chunking code...")
            chunks = chunking_service.chunk_repository_files(repo_id, files_data)
            
            if not chunks:
                await database_service.update_repository_status(repo_id, "completed", log="No valid code files found.")
                return

            # 4. Embeddings
            await database_service.update_repository_status(repo_id, "running", log="Generating embeddings...")
            texts = [c['chunk'] for c in chunks]
            
            # We must be careful not to block the event loop if generate_embeddings is synchronous
            # OpenAI client provides async versions, or we can use loop.run_in_executor
            loop = asyncio.get_event_loop()
            embeddings = await loop.run_in_executor(
                None, 
                embedding_service.generate_embeddings, 
                texts
            )
            
            # 5. Store in Qdrant
            await database_service.update_repository_status(repo_id, "running", log="Storing in vector database...")
            ids = [str(uuid.uuid5(uuid.NAMESPACE_URL, c['chunkId'])) for c in chunks]
            
            await loop.run_in_executor(
                None,
                qdrant_service.upsert_chunks,
                embeddings,
                chunks,
                ids
            )
            
            # 6. Completed
            await database_service.update_repository_status(repo_id, "completed", log="Analysis completed successfully.")
            
        except Exception as e:
            error_trace = traceback.format_exc()
            print(f"Error processing {repo_id}: {error_trace}")
            await database_service.update_repository_status(repo_id, "failed", log=f"Error: {str(e)}")
            raise e
        finally:
            # Cleanup local clone to save space
            try:
                ingestion_service.delete_repository(repo_id)
            except Exception:
                pass

scanner_worker = ScannerWorker()
