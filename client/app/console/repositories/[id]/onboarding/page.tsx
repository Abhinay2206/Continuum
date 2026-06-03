import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { RepositoryOnboarding } from '@/components/onboarding/RepositoryOnboarding';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OnboardingPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;

  const repository = await prisma.repository.findUnique({
    where: { id },
    include: {
      workspace: true,
      imports: { orderBy: { createdAt: 'desc' }, take: 1 },
      frameworks: true,
      dependencies: true,
    },
  });

  if (!repository) notFound();
  if (repository.workspace.userId !== session.user.id) redirect('/console/repositories');

  const latestImport = repository.imports[0] ?? null;

  const initialData = {
    repoId: repository.id,
    repoName: repository.name,
    fullName: repository.fullName,
    language: repository.language ?? null,
    status: (latestImport?.status ?? 'pending') as 'pending' | 'running' | 'completed' | 'failed',
    log: latestImport?.log ?? '',
    updatedAt: (latestImport?.updatedAt ?? repository.createdAt).toISOString(),
    createdAt: (latestImport?.createdAt ?? repository.createdAt).toISOString(),
    frameworks: repository.frameworks.map((f) => f.name),
    dependencyCount: repository.dependencies.length,
  };

  return <RepositoryOnboarding repoId={id} initialData={initialData} />;
}
