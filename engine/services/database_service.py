from __future__ import annotations

import asyncpg
import json
from core.config import settings

class DatabaseService:
    def __init__(self):
        self.pool = None

    async def connect(self):
        if not self.pool:
            self.pool = await asyncpg.create_pool(settings.database_url)

    async def close(self):
        if self.pool:
            await self.pool.close()

    async def get_repository_clone_info(self, repo_id: str) -> dict | None:
        """
        Return ``{"url": ..., "default_branch": ...}`` for a repository so the
        workspace layer can re-clone it on demand. ``repo_id`` is Repository.id.
        Returns None if the repository is unknown.
        """
        if not self.pool:
            await self.connect()

        async with self.pool.acquire() as connection:
            row = await connection.fetchrow(
                'SELECT url, "defaultBranch" FROM "Repository" WHERE id = $1',
                repo_id,
            )
            if row:
                return {"url": row["url"], "default_branch": row["defaultBranch"]}
            return None

    async def save_agent_results(self, repo_id: str, results: dict):
        """Persist agent analysis results and mark the import as completed."""
        if not self.pool:
            await self.connect()

        async with self.pool.acquire() as connection:
            import_record = await connection.fetchrow(
                'SELECT id FROM "RepositoryImport" WHERE "repositoryId" = $1 ORDER BY "createdAt" DESC LIMIT 1',
                repo_id
            )
            if import_record:
                await connection.execute(
                    'UPDATE "RepositoryImport" SET "agentResults" = $1::jsonb, status = \'completed\', "updatedAt" = NOW() WHERE id = $2',
                    json.dumps(results), import_record['id']
                )
                print(f"[DB] Agent results saved and status set to completed for repo {repo_id}")
            else:
                print(f"[DB] Warning: No RepositoryImport found for repo {repo_id} — results not saved")

    async def update_repository_status(self, repo_id: str, status: str, log: str = None):
        """
        Updates the RepositoryImport status in the PostgreSQL database.
        """
        if not self.pool:
            await self.connect()
            
        async with self.pool.acquire() as connection:
            # First, check if a RepositoryImport exists for this repository. If not, we might need to create it.
            # But normally, Next.js API already creates a 'pending' import. Let's find the latest one.
            import_record = await connection.fetchrow(
                'SELECT id FROM "RepositoryImport" WHERE "repositoryId" = $1 ORDER BY "createdAt" DESC LIMIT 1',
                repo_id
            )
            
            if import_record:
                if log:
                    await connection.execute(
                        'UPDATE "RepositoryImport" SET status = $1, log = COALESCE(log, \'\') || $2::text, "updatedAt" = NOW() WHERE id = $3',
                        status, f"\n{log}", import_record['id']
                    )
                else:
                    await connection.execute(
                        'UPDATE "RepositoryImport" SET status = $1, "updatedAt" = NOW() WHERE id = $2',
                        status, import_record['id']
                    )
            else:
                # If no import record exists, we probably shouldn't do anything or we could insert one.
                # Assuming Next.js always creates it first.
                print(f"Warning: No RepositoryImport record found for repoId {repo_id}")

database_service = DatabaseService()
