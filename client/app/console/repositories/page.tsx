import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { RepositoriesClient } from "./RepositoriesClient";
import { redirect } from "next/navigation";

export default async function RepositoriesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const repositories = await prisma.repository.findMany({
    where: {
      workspace: {
        userId: session.user.id,
      },
    },
    include: {
      imports: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      frameworks: true,
      dependencies: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <RepositoriesClient 
      repositories={repositories} 
    />
  );
}
