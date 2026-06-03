import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GithubService } from '@/server/services/GithubService';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const repositories = await GithubService.getAccessibleRepositories(session.user.id);
    return NextResponse.json({ repositories });
  } catch (error: any) {
    console.error('Fetch GitHub repos error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
