import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { UserProvider } from '@/components/providers/UserProvider';

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  let [workspace, githubAccount, dbUser] = await Promise.all([
    prisma.workspace.findFirst({
      where: { userId: session.user.id },
    }),
    prisma.githubAccount.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
    }),
  ]);

  // If the user's session exists but the user was deleted from the database
  if (!dbUser) {
    // We can't use cookies().delete easily with NextAuth because of dynamic naming based on env (Secure prefix).
    // Instead, we redirect to a special path or just to the NextAuth signout which clears cookies.
    redirect('/api/auth/signout?callbackUrl=/login');
  }

  if (!workspace) {
    // Fallback if somehow they don't have a workspace, create one
    workspace = await prisma.workspace.create({
      data: {
        name: `${session.user.name || 'Personal'} Workspace`,
        userId: session.user.id,
      },
    });
  }

  return (
    <UserProvider 
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
      workspace={{
        id: workspace?.id || '',
        name: workspace?.name || '',
      }}
      githubConnected={!!githubAccount}
    >
      <div className="flex min-h-[100dvh] overflow-hidden bg-[var(--console-bg)] text-[#eef1f8] selection:bg-cyan-300/20 selection:text-white">
        <Sidebar />
        <div className="relative flex h-[100dvh] min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main className="relative min-w-0 flex-1 overflow-y-auto px-5 py-5 lg:px-8">
            <div className="relative z-10 mx-auto w-full max-w-[1480px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
