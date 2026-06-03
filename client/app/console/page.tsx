import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ConsoleDashboard } from "./ConsoleDashboard";
import { redirect } from "next/navigation";

export const metadata = { title: "Dashboard" };

function safeAgentResults(raw: any) {
  if (!raw || typeof raw !== "object") return null;
  return raw as {
    scores: {
      overall_score: number;
      security_score: number;
      bug_score: number;
      architecture_score: number;
      code_quality_score: number;
    };
    risk_level: string;
    total_findings: number;
    critical_findings: number;
    findings: {
      bugs: any[];
      security: any[];
      architecture: any[];
      code_review: any[];
      dependencies: any[];
    };
    agents_run: string[];
    agent_statuses: any[];
  };
}

export default async function ConsolePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [repositories, totalRepos, failedImports, recentImports] = await Promise.all([
    prisma.repository.findMany({
      where: { workspace: { userId: session.user.id } },
      include: {
        imports: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            createdAt: true,
            agentResults: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.repository.count({ where: { workspace: { userId: session.user.id } } }),
    prisma.repositoryImport.count({
      where: { repository: { workspace: { userId: session.user.id } }, status: "failed" },
    }),
    prisma.repositoryImport.findMany({
      where: { repository: { workspace: { userId: session.user.id } } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { repository: { select: { name: true } } },
    }),
  ]);

  // Compute real aggregate metrics from agentResults
  const analyzedRepos = repositories.filter(r => {
    const imp = r.imports?.[0];
    return imp?.status === "completed" && imp?.agentResults;
  });

  const scores = analyzedRepos
    .map(r => safeAgentResults(r.imports?.[0]?.agentResults))
    .filter(Boolean);

  const avgScore = scores.length
    ? Math.round(scores.reduce((s, r) => s + (r!.scores.overall_score ?? 0), 0) / scores.length)
    : 0;

  const avgSecurityScore = scores.length
    ? Math.round(scores.reduce((s, r) => s + (r!.scores.security_score ?? 0), 0) / scores.length)
    : 0;

  const totalCritical = scores.reduce((s, r) => s + (r!.critical_findings ?? 0), 0);
  const totalFindings = scores.reduce((s, r) => s + (r!.total_findings ?? 0), 0);
  const totalSecurityIssues = scores.reduce(
    (s, r) => s + (r!.findings?.security?.length ?? 0), 0
  );
  const totalBugIssues = scores.reduce(
    (s, r) => s + (r!.findings?.bugs?.length ?? 0), 0
  );

  // Build enriched repo list
  const enrichedRepos = repositories.map(repo => {
    const imp = repo.imports?.[0];
    const ar = safeAgentResults(imp?.agentResults);
    return {
      id: repo.id,
      name: repo.name,
      fullName: (repo as any).fullName ?? repo.name,
      language: (repo as any).language ?? null,
      status: imp?.status ?? "none",
      agentResults: ar ? {
        scores: ar.scores,
        risk_level: ar.risk_level,
        total_findings: ar.total_findings,
        critical_findings: ar.critical_findings,
        security_count: ar.findings?.security?.length ?? 0,
        bug_count: ar.findings?.bugs?.length ?? 0,
        agents_run: ar.agents_run ?? [],
      } : null,
    };
  });

  const recentActivity = recentImports.map((imp: any) => ({
    title:
      imp.status === "completed"
        ? "Repository analyzed"
        : imp.status === "failed"
        ? "Import failed"
        : imp.status === "running"
        ? "Analysis running"
        : "Import queued",
    repo: imp.repository.name,
    time: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(imp.createdAt),
    status: imp.status,
  }));

  return (
    <ConsoleDashboard
      repositories={enrichedRepos}
      metrics={{
        totalRepos,
        health: avgScore || (totalRepos === 0 ? 100 : Math.max(0, Math.round(((totalRepos - failedImports) / totalRepos) * 100))),
        avgScore,
        avgSecurityScore,
        totalCritical,
        totalFindings,
        totalSecurityIssues,
        totalBugIssues,
        analyzedCount: analyzedRepos.length,
        indexingCount: repositories.filter(r => {
          const s = r.imports?.[0]?.status;
          return s === "running" || s === "pending";
        }).length,
      }}
      recentActivity={recentActivity}
    />
  );
}
