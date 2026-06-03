import { Worker, Job } from 'bullmq';
import { prisma } from '../../lib/prisma';
import { decryptToken } from '../lib/encryption';
import simpleGit from 'simple-git';
import fs from 'fs/promises';
import path from 'path';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

const STORAGE_PATH = process.env.REPO_STORAGE_PATH || '/tmp/continuum-repos';

export const repositoryWorker = new Worker(
  'repository-import',
  async (job: Job) => {
    const { userId, repositoryId, githubRepoFullName, workspaceId } = job.data;
    
    await prisma.repositoryImport.updateMany({
      where: { repositoryId, status: 'pending' },
      data: { status: 'running' },
    });

    try {
      // 1. Get user GitHub token
      const githubAccount = await prisma.githubAccount.findUnique({ where: { userId } });
      if (!githubAccount) throw new Error('GitHub account not connected');
      
      const decryptedToken = decryptToken(githubAccount.encryptedToken, githubAccount.encryptedTokenIv);

      // 2. Clone Repository
      const repoUrl = `https://oauth2:${decryptedToken}@github.com/${githubRepoFullName}.git`;
      const clonePath = path.join(STORAGE_PATH, repositoryId);
      
      await fs.mkdir(STORAGE_PATH, { recursive: true }).catch(() => {});
      await fs.rm(clonePath, { recursive: true, force: true }).catch(() => {});

      const git = simpleGit();
      await git.clone(repoUrl, clonePath);

      // 3. Analysis Pipeline
      const files = await fs.readdir(clonePath);
      
      const detectedFrameworks: string[] = [];

      if (files.includes('package.json')) {
        const pkgJson = JSON.parse(await fs.readFile(path.join(clonePath, 'package.json'), 'utf8'));
        const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
        
        if (deps['next']) detectedFrameworks.push('Next.js');
        if (deps['react']) detectedFrameworks.push('React');
        if (deps['vue']) detectedFrameworks.push('Vue');
        if (deps['@angular/core']) detectedFrameworks.push('Angular');
        if (deps['express']) detectedFrameworks.push('Express');
        if (deps['@nestjs/core']) detectedFrameworks.push('NestJS');
      }

      if (files.includes('requirements.txt')) {
        const reqs = await fs.readFile(path.join(clonePath, 'requirements.txt'), 'utf8');
        if (reqs.includes('Django')) detectedFrameworks.push('Django');
        if (reqs.includes('Flask')) detectedFrameworks.push('Flask');
      }

      if (files.includes('pom.xml')) {
        const pom = await fs.readFile(path.join(clonePath, 'pom.xml'), 'utf8');
        if (pom.includes('spring-boot')) detectedFrameworks.push('Spring Boot');
      }

      // 4. Update Database Metadata
      await prisma.$transaction(async (tx) => {
        await tx.repositoryFramework.deleteMany({ where: { repositoryId } });
        for (const fw of detectedFrameworks) {
          await tx.repositoryFramework.create({
            data: { repositoryId, name: fw },
          });
        }
        
        await tx.repositoryImport.updateMany({
          where: { repositoryId, status: 'running' },
          data: { status: 'completed', log: 'Repository cloned and analyzed successfully.' },
        });
      });

    } catch (error: any) {
      console.error(`Import failed for repository ${repositoryId}:`, error);
      await prisma.repositoryImport.updateMany({
        where: { repositoryId, status: 'running' },
        data: { status: 'failed', log: error.message },
      });
      throw error;
    }
  },
  { connection }
);
