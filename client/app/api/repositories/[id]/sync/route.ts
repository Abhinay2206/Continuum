import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { enqueueRepositoryImport } from '@/server/jobs/repositoryQueue';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: repositoryId } = await params;

    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
      include: { workspace: true },
    });

    if (!repository) {
      return NextResponse.json({ message: 'Repository not found' }, { status: 404 });
    }
    
    if (repository.workspace.userId !== session.user.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const importJob = await prisma.repositoryImport.create({
      data: {
        repositoryId: repository.id,
        status: 'pending',
      },
    });

    await enqueueRepositoryImport(
      session.user.id,
      repository.id,
      repository.fullName,
      repository.workspaceId
    );

    return NextResponse.json({ message: 'Sync queued', importJobId: importJob.id }, { status: 202 });
  } catch (error: any) {
    console.error('Sync repository error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
