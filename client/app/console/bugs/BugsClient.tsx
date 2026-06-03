'use client';

import { useState, useEffect } from 'react';
import {
  Bug, AlertTriangle, CheckCircle2, FileCode, GitPullRequest,
  Database, ArrowRight, Loader2, ShieldAlert, RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/console/Premium';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Finding {
  title?: string;
  issue?: string;
  severity?: string;
  description?: string;
  recommendation?: string;
  file?: string;
  line?: number | string;
}

interface AgentResults {
  findings: {
    bugs: Finding[];
    security: Finding[];
  };
  scores: {
    bug_score: number;
    security_score: number;
    overall_score: number;
  };
  risk_level: string;
}

interface Repo {
  id: string;
  name: string;
  fullName: string;
  language: string | null;
  status: string;
  agentResults: AgentResults | null;
}

interface FlatBug extends Finding {
  repoId: string;
  repoName: string;
  category: 'bug' | 'security';
  index: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const severityTone = (s?: string) =>
  s === 'critical' ? 'rose' as const :
  s === 'high'     ? 'amber' as const :
  s === 'medium'   ? 'sky' as const   : 'emerald' as const;

function flattenBugs(repos: Repo[]): FlatBug[] {
  const all: FlatBug[] = [];
  for (const repo of repos) {
    if (!repo.agentResults) continue;
    const bugs = repo.agentResults.findings?.bugs ?? [];
    const security = repo.agentResults.findings?.security ?? [];
    bugs.forEach((b, i) =>
      all.push({ ...b, repoId: repo.id, repoName: repo.name, category: 'bug', index: i })
    );
    security.forEach((s, i) =>
      all.push({ ...s, repoId: repo.id, repoName: repo.name, category: 'security', index: i })
    );
  }
  // Sort by severity
  const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return all.sort((a, b) => (order[a.severity ?? 'low'] ?? 3) - (order[b.severity ?? 'low'] ?? 3));
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function BugsClient({ repos }: { repos: Repo[] }) {
  const allBugs = flattenBugs(repos);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const activeBug = allBugs[selectedIdx] ?? null;

  const hasAnalyzed = repos.some((r) => !!r.agentResults);
  const router = useRouter();

  useEffect(() => {
    const isAnalyzing = repos.some(
      (r) => r.status === 'running' || r.status === 'pending' || (r.status === 'completed' && !r.agentResults)
    );
    if (isAnalyzing) {
      const interval = setInterval(() => {
        router.refresh();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [repos, router]);

  if (repos.length === 0) return <EmptyState />;

  return (
    <div className="pb-10">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-console-text">Bug Fixes</h1>
        <Link
          href="/console/repositories"
          className="flex items-center gap-1.5 rounded-[6px] bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          <GitPullRequest size={12} />
          Manage Repos
        </Link>
      </div>

      {!hasAnalyzed ? (
        <PendingState repos={repos} />
      ) : allBugs.length === 0 ? (
        <CleanState />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          {/* Bug list */}
          <div>
            <div className="mb-2.5 flex items-center justify-between text-[12px]">
              <span className="text-console-muted">Open issues</span>
              <span className="text-console-rose">{allBugs.length} found</span>
            </div>
            <div className="divide-y divide-console-border rounded-[7px] border border-console-border">
              {allBugs.map((bug, i) => (
                <button
                  key={`${bug.repoId}-${bug.category}-${bug.index}`}
                  onClick={() => setSelectedIdx(i)}
                  className={[
                    'flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-console-bg-soft',
                    i === selectedIdx ? 'bg-console-bg-soft' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge tone={severityTone(bug.severity)}>{bug.severity ?? 'low'}</StatusBadge>
                    <span className="rounded-full border border-white/[0.06] px-2 py-px text-[10px] text-console-faint">
                      {bug.category}
                    </span>
                  </div>
                  <div className="text-[12px] font-medium text-console-text line-clamp-2">
                    {bug.title ?? bug.issue ?? 'Finding'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-console-faint">
                    <FileCode size={10} />
                    {bug.repoName}
                    {bug.file && <> · <span className="truncate font-mono max-w-[100px]">{bug.file}</span></>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bug detail */}
          {activeBug && <BugDetail bug={activeBug} />}
        </div>
      )}
    </div>
  );
}

function BugDetail({ bug }: { bug: FlatBug }) {
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const router = useRouter();

  const handleReanalyze = async () => {
    if (isReanalyzing) return;
    setIsReanalyzing(true);
    try {
      await fetch(`/api/repositories/${bug.repoId}/analysis`, { method: 'POST' });
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsReanalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-[7px] border border-console-border px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge tone={severityTone(bug.severity)}>{bug.severity ?? 'low'}</StatusBadge>
            <StatusBadge tone={bug.category === 'security' ? 'rose' : 'amber'}>
              {bug.category}
            </StatusBadge>
          </div>
          <button
            onClick={handleReanalyze}
            disabled={isReanalyzing}
            className="flex items-center gap-1.5 rounded-[5px] bg-white/[0.05] px-3 py-1.5 text-[11px] font-medium text-console-text transition-colors hover:bg-white/[0.1] disabled:opacity-50"
          >
            {isReanalyzing ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            Re-analyze Repo
          </button>
        </div>
        <h2 className="mt-2 text-[15px] font-semibold text-console-text">
          {bug.title ?? bug.issue ?? 'Finding'}
        </h2>
        <p className="mt-0.5 font-mono text-[12px] text-console-faint">
          {bug.repoName}{bug.file ? ` · ${bug.file}` : ''}
          {bug.line ? `:${bug.line}` : ''}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        {/* Root cause & fix */}
        <div className="space-y-3">
          {bug.description && (
            <div className="rounded-[7px] border border-amber-300/20 bg-amber-300/[0.04] px-4 py-3 text-[12px] leading-relaxed text-console-muted">
              {bug.description}
            </div>
          )}

          {bug.recommendation && (
            <div className="overflow-hidden rounded-[6px] border border-console-border">
              <div className="flex items-center justify-between border-b border-console-border px-3 py-2 text-[11px] text-console-faint">
                <span>Recommendation</span>
                <span className="text-console-emerald">Agent suggestion</span>
              </div>
              <div className="p-4">
                <p className="text-[13px] leading-relaxed text-console-text">{bug.recommendation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="space-y-3">
          <div className="rounded-[7px] border border-console-border p-3">
            <div className="mb-2 text-[12px] font-semibold text-console-muted">Details</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-console-muted">Severity</span>
                <StatusBadge tone={severityTone(bug.severity)}>{bug.severity ?? 'low'}</StatusBadge>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-console-muted">Category</span>
                <span className="text-console-text capitalize">{bug.category}</span>
              </div>
              {bug.file && (
                <div className="flex items-start justify-between gap-2 text-[12px]">
                  <span className="shrink-0 text-console-muted">File</span>
                  <span className="truncate text-right font-mono text-[11px] text-console-text">{bug.file}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-console-muted">Repository</span>
                <span className="text-console-text">{bug.repoName}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[7px] border border-console-border p-3">
            <div className="mb-2 text-[12px] font-semibold text-console-muted">Analysis</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[12px] text-console-muted">
                <CheckCircle2 size={12} className="text-emerald-400" />
                Detected by AI analysis
              </div>
              <div className="flex items-center gap-2 text-[12px] text-console-muted">
                {bug.recommendation ? (
                  <CheckCircle2 size={12} className="text-emerald-400" />
                ) : (
                  <ShieldAlert size={12} className="text-amber-400" />
                )}
                {bug.recommendation ? 'Fix available' : 'Manual review needed'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[7px] border border-console-border">
      <Bug size={32} className="mb-3 text-zinc-600" />
      <p className="text-[14px] font-medium text-console-text">No repositories connected</p>
      <p className="mt-1 text-[12px] text-console-faint">Import a repository to start bug detection</p>
      <Link
        href="/console/repositories"
        className="mt-4 flex items-center gap-1.5 rounded-[6px] bg-white px-4 py-2 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200"
      >
        Go to Repositories <ArrowRight size={11} />
      </Link>
    </div>
  );
}

function PendingState({ repos }: { repos: Repo[] }) {
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const router = useRouter();
  
  const stuckRepos = repos.filter(r => r.status === 'completed' && !r.agentResults);
  const hasIndexed = stuckRepos.length > 0;

  const handleReanalyzeAll = async () => {
    if (isReanalyzing) return;
    setIsReanalyzing(true);
    try {
      for (const repo of stuckRepos) {
        await fetch(`/api/repositories/${repo.id}/analysis`, { method: 'POST' });
      }
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsReanalyzing(false);
    }
  };

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[7px] border border-console-border">
      {hasIndexed ? (
        <>
          <Loader2 size={28} className="mb-3 animate-spin text-sky-400" />
          <p className="text-[14px] font-medium text-console-text">Agent analysis running…</p>
          <p className="mt-1 text-[12px] text-console-faint">Bug detection is processing in the background.</p>
          <button
            onClick={handleReanalyzeAll}
            disabled={isReanalyzing}
            className="mt-4 flex items-center gap-1.5 rounded-[5px] bg-white/[0.05] px-4 py-2 text-[12px] font-medium text-console-text transition-colors hover:bg-white/[0.1] disabled:opacity-50"
          >
            {isReanalyzing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Force Re-analyze
          </button>
        </>
      ) : (
        <>
          <AlertTriangle size={28} className="mb-3 text-amber-400" />
          <p className="text-[14px] font-medium text-console-text">Repositories not yet indexed</p>
          <p className="mt-1 text-[12px] text-console-faint">Sync a repository to trigger bug detection agents.</p>
          <Link
            href="/console/repositories"
            className="mt-4 flex items-center gap-1.5 rounded-[6px] bg-white px-4 py-2 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Sync Repository <ArrowRight size={11} />
          </Link>
        </>
      )}
    </div>
  );
}

function CleanState() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[7px] border border-console-border">
      <CheckCircle2 size={32} className="mb-3 text-emerald-400" />
      <p className="text-[14px] font-medium text-console-text">No bugs found</p>
      <p className="mt-1 text-[12px] text-console-faint">Your repositories look clean — great work!</p>
    </div>
  );
}
