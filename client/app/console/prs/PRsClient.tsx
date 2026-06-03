'use client';

import { useState, useEffect } from 'react';
import {
  GitPullRequest, Code2, FileCode, CheckCircle2, AlertTriangle,
  Database, ArrowRight, Loader2, RefreshCw, Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/console/Premium';
import Link from 'next/link';

interface ReviewFinding {
  issue?: string;
  title?: string;
  description?: string;
  recommendation?: string;
  severity?: string;
  file?: string;
  line?: number | string;
}

interface AgentResults {
  findings: {
    code_review: ReviewFinding[];
    bugs: ReviewFinding[];
    security: ReviewFinding[];
  };
  scores: {
    overall_score: number;
    code_quality_score: number;
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

interface FlatReview extends ReviewFinding {
  repoId: string;
  repoName: string;
  index: number;
}

const severityTone = (s?: string) =>
  s === 'critical' ? 'rose' as const :
  s === 'high'     ? 'amber' as const :
  s === 'medium'   ? 'sky' as const   : 'emerald' as const;

function flattenReviews(repos: Repo[]): FlatReview[] {
  const all: FlatReview[] = [];
  for (const repo of repos) {
    if (!repo.agentResults) continue;
    const reviews = repo.agentResults.findings?.code_review ?? [];
    reviews.forEach((r, i) =>
      all.push({ ...r, repoId: repo.id, repoName: repo.name, index: i })
    );
  }
  const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return all.sort((a, b) => (order[a.severity ?? 'low'] ?? 3) - (order[b.severity ?? 'low'] ?? 3));
}

export function PRsClient({ repos }: { repos: Repo[] }) {
  const allReviews = flattenReviews(repos);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const activeReview = allReviews[selectedIdx] ?? null;
  const hasAnalyzed = repos.some((r) => !!r.agentResults);
  const router = useRouter();

  useEffect(() => {
    const isAnalyzing = repos.some(
      (r) => r.status === 'running' || r.status === 'pending' || (r.status === 'completed' && !r.agentResults)
    );
    if (isAnalyzing) {
      const interval = setInterval(() => router.refresh(), 5000);
      return () => clearInterval(interval);
    }
  }, [repos, router]);

  if (repos.length === 0) {
    return (
      <div className="pb-10">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-[18px] font-semibold text-console-text">Pull Requests</h1>
        </div>
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[7px] border border-console-border">
          <GitPullRequest size={32} className="mb-3 text-zinc-600" />
          <p className="text-[14px] font-medium text-console-text">No repositories connected</p>
          <p className="mt-1 text-[12px] text-console-faint">Import a repository to activate code review agents</p>
          <Link
            href="/console/repositories"
            className="mt-4 flex items-center gap-1.5 rounded-[6px] bg-white px-4 py-2 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Go to Repositories <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-console-text">Pull Requests</h1>
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
      ) : allReviews.length === 0 ? (
        <CleanState />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          {/* Review list */}
          <div>
            <div className="mb-2.5 flex items-center justify-between text-[12px]">
              <span className="text-console-muted">Code Review Findings</span>
              <span className="text-console-sky">{allReviews.length} items</span>
            </div>
            <div className="divide-y divide-console-border rounded-[7px] border border-console-border">
              {allReviews.map((review, i) => (
                <button
                  key={`${review.repoId}-review-${review.index}`}
                  onClick={() => setSelectedIdx(i)}
                  className={[
                    'flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-console-bg-soft',
                    i === selectedIdx ? 'bg-console-bg-soft' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge tone={severityTone(review.severity)}>{review.severity ?? 'low'}</StatusBadge>
                  </div>
                  <div className="text-[12px] font-medium text-console-text line-clamp-2">
                    {review.title ?? review.issue ?? 'Review finding'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-console-faint">
                    <FileCode size={10} />
                    {review.repoName}
                    {review.file && (
                      <> · <span className="truncate font-mono max-w-[100px]">{review.file}</span></>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Review detail */}
          {activeReview && <ReviewDetail review={activeReview} />}
        </div>
      )}
    </div>
  );
}

function ReviewDetail({ review }: { review: FlatReview }) {
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const router = useRouter();

  const handleReanalyze = async () => {
    if (isReanalyzing) return;
    setIsReanalyzing(true);
    try {
      await fetch(`/api/repositories/${review.repoId}/analysis`, { method: 'POST' });
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
            <StatusBadge tone={severityTone(review.severity)}>{review.severity ?? 'low'}</StatusBadge>
            <StatusBadge tone="sky">code review</StatusBadge>
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
          {review.title ?? review.issue ?? 'Review finding'}
        </h2>
        <p className="mt-0.5 font-mono text-[12px] text-console-faint">
          {review.repoName}{review.file ? ` · ${review.file}` : ''}
          {review.line ? `:${review.line}` : ''}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        {/* Description & recommendation */}
        <div className="space-y-3">
          {review.description && (
            <div className="rounded-[7px] border border-sky-300/20 bg-sky-300/[0.04] px-4 py-3 text-[12px] leading-relaxed text-console-muted">
              {review.description}
            </div>
          )}
          {review.recommendation && (
            <div className="overflow-hidden rounded-[6px] border border-console-border">
              <div className="flex items-center justify-between border-b border-console-border px-3 py-2 text-[11px] text-console-faint">
                <span>Recommendation</span>
                <span className="text-console-sky">Agent suggestion</span>
              </div>
              <div className="p-4">
                <p className="text-[13px] leading-relaxed text-console-text">{review.recommendation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="rounded-[7px] border border-console-border p-3">
          <div className="mb-2 text-[12px] font-semibold text-console-muted">Details</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-console-muted">Severity</span>
              <StatusBadge tone={severityTone(review.severity)}>{review.severity ?? 'low'}</StatusBadge>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-console-muted">Type</span>
              <span className="text-console-text capitalize">Code Review</span>
            </div>
            {review.file && (
              <div className="flex items-start justify-between gap-2 text-[12px]">
                <span className="shrink-0 text-console-muted">File</span>
                <span className="truncate text-right font-mono text-[11px] text-console-text">{review.file}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-console-muted">Repository</span>
              <span className="text-console-text">{review.repoName}</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-console-muted">
              {review.recommendation ? (
                <CheckCircle2 size={12} className="text-emerald-400" />
              ) : (
                <Code2 size={12} className="text-sky-400" />
              )}
              {review.recommendation ? 'Fix suggestion available' : 'Manual review needed'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PendingState({ repos }: { repos: Repo[] }) {
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const router = useRouter();
  const stuckRepos = repos.filter((r) => r.status === 'completed' && !r.agentResults);

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
      {stuckRepos.length > 0 ? (
        <>
          <Activity size={28} className="mb-3 animate-pulse text-sky-400" />
          <p className="text-[14px] font-medium text-console-text">Code review agents running…</p>
          <p className="mt-1 text-[12px] text-console-faint">Analysis is processing in the background.</p>
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
          <p className="mt-1 text-[12px] text-console-faint">Sync a repository to trigger code review agents.</p>
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
      <p className="text-[14px] font-medium text-console-text">No code review findings</p>
      <p className="mt-1 text-[12px] text-console-faint">Your code looks clean — great work!</p>
    </div>
  );
}
