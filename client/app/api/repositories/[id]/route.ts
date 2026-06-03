import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Prisma relations (imports, frameworks, dependencies) should be configured to cascade on delete.
    // If not, we might need to manually delete them. Let's assume Prisma handles cascades or we delete them.
    await prisma.repositoryImport.deleteMany({ where: { repositoryId } });
    await prisma.repositoryFramework.deleteMany({ where: { repositoryId } });
    await prisma.repositoryDependency.deleteMany({ where: { repositoryId } });
    await prisma.repository.delete({ where: { id: repositoryId } });

    // Tell the Python FastAPI Engine to cleanup Qdrant vectors and local workspace files
    try {
      await fetch(`http://localhost:8000/repositories/${repositoryId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error("Failed to delete repository from engine:", e);
    }

    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete repository error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
