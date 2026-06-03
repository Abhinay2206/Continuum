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
      status: latestImport?.status ?? 'pending',
      agentResults: latestImport?.agentResults ?? null,
    });
  } catch (error: any) {
    console.error('Analysis fetch error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(
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
      include: { workspace: true },
    });

    if (!repository) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    if (repository.workspace.userId !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Call engine to trigger re-analysis in background
    await fetch(`http://localhost:8000/repositories/${repository.id}/reanalyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return NextResponse.json({ message: 'Re-analysis started' }, { status: 202 });
  } catch (error: any) {
    console.error('Re-analysis trigger error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
