import { Queue } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

export const repositoryImportQueue = new Queue('repository-import', { connection });

export async function enqueueRepositoryImport(
  userId: string,
  repositoryId: string,
  githubRepoFullName: string,
  workspaceId: string
) {
  await repositoryImportQueue.add(
    'import',
    { userId, repositoryId, githubRepoFullName, workspaceId },
    { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
  );
}
