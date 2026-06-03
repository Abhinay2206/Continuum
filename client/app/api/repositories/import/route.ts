import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { RepositoryService } from '@/server/services/RepositoryService';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, repository } = await req.json();

    if (!workspaceId || !repository) {
      return NextResponse.json({ message: 'Missing workspaceId or repository payload' }, { status: 400 });
    }

    const result = await RepositoryService.importRepository(
      session.user.id,
      workspaceId,
      repository
    );

    return NextResponse.json(result, { status: 202 });
  } catch (error: any) {
    console.error('Import repository error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
