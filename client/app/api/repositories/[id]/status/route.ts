import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: repositoryId } = await params;

    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
      include: {
        workspace: true,
        imports: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        frameworks: true,
        dependencies: true,
      },
    });

    if (!repository) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    if (repository.workspace.userId !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const latestImport = repository.imports[0] ?? null;

    return NextResponse.json({
      repoId: repository.id,
      repoName: repository.name,
      fullName: repository.fullName,
      language: repository.language,
      url: repository.url,
      status: latestImport?.status ?? 'pending',
      log: latestImport?.log ?? '',
      updatedAt: latestImport?.updatedAt ?? repository.createdAt,
      createdAt: latestImport?.createdAt ?? repository.createdAt,
      frameworks: repository.frameworks.map((f) => f.name),
      dependencyCount: repository.dependencies.length,
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
