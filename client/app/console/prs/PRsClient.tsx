'use client';

import { useState, useEffect } from 'react';
import {
  GitPullRequest, Code2, FileCode, CheckCircle2, AlertTriangle,
  Database, ArrowRight, Loader2, RefreshCw, Activity, ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/console/Premium';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ReviewFinding {
  issue?: string;
  title?: string;
  description?: string;
  impact?: string;
  evidence?: string;
  recommendation?: string;
  severity?: string;
  confidence?: number;
  file?: string;
  line_hint?: string;
  effort?: string;
  fix_complexity?: string;
  principle_violated?: string;
}

interface AgentResults {
  findings: {
    code_review: ReviewFinding[];
    bugs: ReviewFinding[];
    security: ReviewFinding[];
  };
  scores: { overall_score: number; code_quality_score: number };
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
  normalizedTitle: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const severityTone = (s?: string) =>
  s === 'critical' ? 'rose' as const :
  s === 'high'     ? 'amber' as const :
  s === 'medium'   ? 'sky' as const   : 'emerald' as const;

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function flattenReviews(repos: Repo[]): FlatReview[] {
  const all: FlatReview[] = [];
  for (const repo of repos) {
    if (!repo.agentResults) continue;
    (repo.agentResults.findings?.code_review ?? []).forEach((r, i) =>
      all.push({ ...r, repoId: repo.id, repoName: repo.name, index: i,
        normalizedTitle: r.issue ?? r.title ?? 'Code Review Finding' })
    );
  }
  return all.sort((a, b) => {
    const s = (SEV_ORDER[a.severity ?? 'low'] ?? 3) - (SEV_ORDER[b.severity ?? 'low'] ?? 3);
    if (s !== 0) return s;
    return (b.confidence ?? 0) - (a.confidence ?? 0);
  });
}

// ── Small Components ──────────────────────────────────────────────────────────

function ConfidenceBadge({ value }: { value?: number }) {
  if (!value) return null;
  const cls =
    value >= 85 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25' :
    value >= 70 ? 'text-amber-400  bg-amber-400/10  border-amber-400/25' :
                  'text-zinc-400   bg-zinc-400/10   border-zinc-400/25';
  return (
    <span className={`inline-flex items-center rounded-[4px] border px-1.5 py-px font-mono text-[10px] font-semibold ${cls}`}>
      {value}%
    </span>
  );
}

function EffortBadge({ effort }: { effort?: string }) {
  if (!effort) return null;
  const map: Record<string, string> = {
    fix_now:   'text-rose-400  bg-rose-400/10  border-rose-400/25',
    fix_later: 'text-amber-400 bg-amber-400/10 border-amber-400/25',
    optional:  'text-zinc-400  bg-zinc-400/10  border-zinc-400/25',
  };
  const labels: Record<string, string> = { fix_now: 'Fix Now', fix_later: 'Fix Later', optional: 'Optional' };
  return (
    <span className={`inline-flex items-center rounded-[4px] border px-1.5 py-px text-[10px] font-medium ${map[effort] ?? map.optional}`}>
      {labels[effort] ?? effort}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[6px] border border-console-border">
      <div className="border-b border-console-border bg-white/[0.02] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-console-faint">
        {title}
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1 text-[12px]">
      <span className="shrink-0 text-console-muted">{label}</span>
      <div className="flex items-center justify-end">{children}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

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
          <h1 className="text-[18px] font-semibold text-console-text">Code Review</h1>
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
        <div>
          <h1 className="text-[18px] font-semibold text-console-text">Code Review</h1>
          {allReviews.length > 0 && (
            <p className="mt-0.5 text-[12px] text-console-faint">
              {allReviews.filter(r => r.severity === 'high').length} high · {allReviews.length} total findings
            </p>
          )}
        </div>
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
        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          {/* Sidebar list */}
          <div>
            <div className="mb-2.5 flex items-center justify-between text-[12px]">
              <span className="text-console-muted">Findings</span>
              <span className="text-console-sky">{allReviews.length} items</span>
            </div>
            <div className="divide-y divide-console-border rounded-[7px] border border-console-border overflow-hidden">
              {allReviews.map((review, i) => (
                <button
                  key={`${review.repoId}-review-${review.index}`}
                  onClick={() => setSelectedIdx(i)}
                  className={[
                    'flex w-full flex-col gap-1.5 px-3 py-2.5 text-left transition-colors hover:bg-console-bg-soft',
                    i === selectedIdx ? 'bg-console-bg-soft' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-1.5">
                    <StatusBadge tone={severityTone(review.severity)}>{review.severity ?? 'low'}</StatusBadge>
                    <ConfidenceBadge value={review.confidence} />
                  </div>
                  <div className="line-clamp-2 text-[12px] font-medium leading-snug text-console-text">
                    {review.normalizedTitle}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-console-faint">
                    <FileCode size={9} />
                    <span className="truncate">{review.repoName}</span>
                    {review.file && (
                      <><ChevronRight size={9} /><span className="truncate font-mono">{review.file.split('/').pop()}</span></>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          {activeReview && <ReviewDetail review={activeReview} />}
        </div>
      )}
    </div>
  );
}

// ── Review Detail ─────────────────────────────────────────────────────────────

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

  const impactBorder =
    review.severity === 'high'   ? 'border-amber-400/30 bg-amber-400/[0.06]' :
    review.severity === 'medium' ? 'border-sky-400/30 bg-sky-400/[0.05]' :
                                   'border-zinc-600/40 bg-zinc-400/[0.04]';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-[7px] border border-console-border px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge tone={severityTone(review.severity)}>{review.severity ?? 'low'}</StatusBadge>
            <span className="inline-flex items-center rounded-[4px] border border-sky-400/25 bg-sky-400/10 px-1.5 py-px text-[9px] font-bold tracking-wide text-sky-400">
              REV
            </span>
            <ConfidenceBadge value={review.confidence} />
            {review.effort && <EffortBadge effort={review.effort} />}
          </div>
          <button
            onClick={handleReanalyze}
            disabled={isReanalyzing}
            className="flex items-center gap-1.5 rounded-[5px] bg-white/[0.05] px-3 py-1.5 text-[11px] font-medium text-console-text transition-colors hover:bg-white/[0.1] disabled:opacity-50"
          >
            {isReanalyzing ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            Re-analyze
          </button>
        </div>
        <h2 className="mt-2.5 text-[15px] font-semibold leading-snug text-console-text">
          {review.normalizedTitle}
        </h2>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] text-console-faint">
          <span>{review.repoName}</span>
          {review.file && <><span>·</span><span className="text-console-muted">{review.file}</span></>}
          {review.line_hint && <><span>·</span><span>{review.line_hint}</span></>}
        </div>
      </div>

      {/* Impact banner */}
      {review.impact && (
        <div className={`rounded-[7px] border px-4 py-3 ${impactBorder}`}>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-console-faint">Impact</div>
          <p className="text-[13px] leading-relaxed text-console-text">{review.impact}</p>
        </div>
      )}

      {/* Two-column: analysis + meta */}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_240px]">
        {/* Analysis column */}
        <div className="space-y-3">
          {review.description && (
            <Section title="Description">
              <p className="text-[12px] leading-relaxed text-console-muted">{review.description}</p>
            </Section>
          )}

          {review.evidence && (
            <div className="overflow-hidden rounded-[6px] border border-console-border">
              <div className="border-b border-console-border bg-white/[0.02] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-console-faint">
                Evidence
              </div>
              <pre className="overflow-x-auto bg-black/20 px-4 py-3 font-mono text-[11px] leading-relaxed text-console-muted whitespace-pre-wrap">
                {review.evidence}
              </pre>
            </div>
          )}

          {review.recommendation && (
            <Section title="Recommendation">
              <p className="text-[12px] leading-relaxed text-console-text">{review.recommendation}</p>
            </Section>
          )}
        </div>

        {/* Meta sidebar */}
        <div className="rounded-[7px] border border-console-border p-3">
          <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-console-faint">Details</div>
          <MetaRow label="Severity">
            <StatusBadge tone={severityTone(review.severity)}>{review.severity ?? 'low'}</StatusBadge>
          </MetaRow>
          {review.confidence !== undefined && (
            <MetaRow label="Confidence">
              <ConfidenceBadge value={review.confidence} />
            </MetaRow>
          )}
          {review.effort && (
            <MetaRow label="Effort">
              <EffortBadge effort={review.effort} />
            </MetaRow>
          )}
          {review.fix_complexity && (
            <MetaRow label="Complexity">
              <span className="text-[11px] capitalize text-console-text">{review.fix_complexity}</span>
            </MetaRow>
          )}
          {review.principle_violated && (
            <MetaRow label="Principle">
              <span className="rounded-[4px] border border-sky-400/25 bg-sky-400/[0.06] px-1.5 py-px font-mono text-[10px] text-sky-400">
                {review.principle_violated}
              </span>
            </MetaRow>
          )}
          {review.file && (
            <MetaRow label="File">
              <span className="max-w-[140px] truncate text-right font-mono text-[10px] text-console-text" title={review.file}>
                {review.file}
              </span>
            </MetaRow>
          )}
          <MetaRow label="Repository">
            <span className="text-[11px] text-console-text">{review.repoName}</span>
          </MetaRow>
          <MetaRow label="Agent">
            <span className="inline-flex items-center rounded-[4px] border border-sky-400/25 bg-sky-400/10 px-1.5 py-px text-[9px] font-bold tracking-wide text-sky-400">
              Code Review Agent
            </span>
          </MetaRow>
        </div>
      </div>
    </div>
  );
}

// ── State Components ──────────────────────────────────────────────────────────

function PendingState({ repos }: { repos: Repo[] }) {
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const router = useRouter();
  const stuckRepos = repos.filter(r => r.status === 'completed' && !r.agentResults);

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
