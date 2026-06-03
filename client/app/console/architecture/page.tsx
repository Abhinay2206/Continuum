export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ArchitectureClient } from './ArchitectureClient';

export default async function ArchitecturePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const workspace = await prisma.workspace.findFirst({
    where: { userId: session.user.id },
    include: {
      repositories: {
        include: {
          imports: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  const repos = (workspace?.repositories ?? []).map((r) => {
    const latest = r.imports[0] ?? null;
    return {
      id: r.id,
      name: r.name,
      fullName: r.fullName,
      language: r.language ?? null,
      status: latest?.status ?? 'pending',
      agentResults: (latest?.agentResults as any) ?? null,
    };
  });

  return <ArchitectureClient repos={repos} />;
}
