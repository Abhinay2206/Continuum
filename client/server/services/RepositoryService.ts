import { prisma } from '@/lib/prisma';

export class RepositoryService {
  static async importRepository(
    userId: string,
    workspaceId: string,
    githubRepoData: {
      githubId: number;
      name: string;
      fullName: string;
      url: string;
      defaultBranch: string;
      language?: string;
      visibility: string;
      size: number;
    }
  ) {
    let repository = await prisma.repository.findUnique({
      where: { githubId: githubRepoData.githubId },
    });

    if (!repository) {
      repository = await prisma.repository.create({
        data: {
          githubId: githubRepoData.githubId,
          name: githubRepoData.name,
          fullName: githubRepoData.fullName,
          url: githubRepoData.url,
          defaultBranch: githubRepoData.defaultBranch,
          language: githubRepoData.language,
          visibility: githubRepoData.visibility,
          size: githubRepoData.size,
          workspaceId,
        },
      });
    }

    const importJob = await prisma.repositoryImport.create({
      data: {
        repositoryId: repository.id,
        status: 'pending',
      },
    });

    try {
      await fetch('http://localhost:8000/repositories/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          githubUrl: repository.url,
          repoId: repository.id,
          workspaceId: workspaceId
        }),
      });
    } catch (e) {
      console.error("Failed to trigger engine scan:", e);
      // We could update the importJob status to failed here if it's completely unreachable
    }

    return { repository, importJobId: importJob.id };
  }
}
