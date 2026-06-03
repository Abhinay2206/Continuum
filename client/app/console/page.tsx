import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ConsoleDashboard } from "./ConsoleDashboard";
import { redirect } from "next/navigation";


export const metadata = { title: "Dashboard" };

export default async function ConsolePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [repositories, totalRepos, failedImports, recentImports] = await Promise.all([
    prisma.repository.findMany({
      where: { workspace: { userId: session.user.id } },
      include: { imports: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.repository.count({
      where: { workspace: { userId: session.user.id } },
    }),
    prisma.repositoryImport.count({
      where: {
        repository: { workspace: { userId: session.user.id } },
        status: "failed",
      },
    }),
    prisma.repositoryImport.findMany({
      where: { repository: { workspace: { userId: session.user.id } } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { repository: true },
    })
  ]);

  const health = totalRepos === 0 ? 100 : Math.max(0, Math.round(((totalRepos - failedImports) / totalRepos) * 100));

  const recentActivity = recentImports.map((imp: { status: string; repository: { name: any; }; createdAt: number | Date | undefined; }) => ({
    title: imp.status === 'completed' ? 'Successfully analyzed repository' : imp.status === 'failed' ? 'Failed to import repository' : 'Started importing repository',
    repo: imp.repository.name,
    time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(imp.createdAt),
    status: imp.status,
  }));

  return (
    <ConsoleDashboard
      repositories={repositories}
      metrics={{ totalRepos, health }}
      recentActivity={recentActivity}
    />
  );
}
