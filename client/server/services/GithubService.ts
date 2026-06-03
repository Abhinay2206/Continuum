import { Octokit } from '@octokit/rest';
import { prisma } from '@/lib/prisma';
import { decryptToken } from '@/server/lib/encryption';

export class GithubService {
  static async getOctokitForUser(userId: string): Promise<Octokit> {
    const githubAccount = await prisma.githubAccount.findUnique({
      where: { userId },
    });

    if (!githubAccount) {
      throw new Error('GitHub account not connected');
    }

    const decryptedToken = decryptToken(
      githubAccount.encryptedToken,
      githubAccount.encryptedTokenIv
    );

    return new Octokit({ auth: decryptedToken });
  }

  static async getAccessibleRepositories(userId: string) {
    const octokit = await this.getOctokitForUser(userId);
    
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
    });

    return repos.map((repo) => ({
      githubId: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      visibility: repo.private ? 'Private' : 'Public',
      language: repo.language,
      defaultBranch: repo.default_branch,
      updatedAt: repo.updated_at,
      size: repo.size,
      owner: repo.owner.login,
    }));
  }
}
