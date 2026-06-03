import asyncio
from services.database_service import database_service

async def main():
    await database_service.connect()
    async with database_service.pool.acquire() as connection:
        repos = await connection.fetch('SELECT id, "name", "githubId" FROM "Repository"')
        print("Repositories in Engine DB:")
        for r in repos:
            print(dict(r))
        
        imports = await connection.fetch('SELECT id, "repositoryId", status FROM "RepositoryImport"')
        print("Imports in Engine DB:")
        for i in imports:
            print(dict(i))

if __name__ == "__main__":
    asyncio.run(main())
