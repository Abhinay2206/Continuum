'use client';

import { useState, useEffect } from 'react';
import {
  Bug, FileCode, GitPullRequest, Database, ArrowRight,
  Loader2, AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck,
  Activity, ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/console/Premium';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Finding {
  title?: string;
  issue?: string;
  severity?: string;
  confidence?: number;
  description?: string;
  impact?: string;
  root_cause?: string;
  evidence?: string;
  recommendation?: string;
  file?: string;
  line_hint?: string;
  effort?: string;
  fix_complexity?: string;
  // Security fields
  cwe?: string;
  owasp?: string;
  exploitation_path?: string;
}

interface AgentResults {
  findings: { bugs: Finding[]; security: Finding[] };
  scores: { bug_score: number; security_score: number; overall_score: number };
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
  normalizedTitle: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const severityTone = (s?: string) =>
  s === 'critical' ? 'rose' as const :
  s === 'high'     ? 'amber' as const :
  s === 'medium'   ? 'sky' as const   : 'emerald' as const;

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function flattenBugs(repos: Repo[]): FlatBug[] {
  const all: FlatBug[] = [];
  for (const repo of repos) {
    if (!repo.agentResults) continue;
    (repo.agentResults.findings?.bugs ?? []).forEach((b, i) =>
      all.push({ ...b, repoId: repo.id, repoName: repo.name, category: 'bug', index: i,
        normalizedTitle: b.title ?? b.issue ?? 'Bug' })
    );
    (repo.agentResults.findings?.security ?? []).forEach((s, i) =>
      all.push({ ...s, repoId: repo.id, repoName: repo.name, category: 'security', index: i,
        normalizedTitle: s.issue ?? s.title ?? 'Security Issue' })
    );
  }
  return all.sort((a, b) => {
    const s = (SEV_ORDER[a.severity ?? 'low'] ?? 3) - (SEV_ORDER[b.severity ?? 'low'] ?? 3);
    if (s !== 0) return s;
    return (b.confidence ?? 0) - (a.confidence ?? 0);
  });
}

// ── Small Shared Components ───────────────────────────────────────────────────

function ConfidenceBadge({ value }: { value?: number }) {
  if (!value) return null;
  const cls =
    value >= 85 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25' :
    value >= 70 ? 'text-amber-400  bg-amber-400/10  border-amber-400/25' :
                  'text-zinc-400   bg-zinc-400/10   border-zinc-400/25';
  const label = value >= 85 ? 'High confidence' : value >= 70 ? 'Medium confidence' : 'Low confidence';
  return (
    <span title={label} className={`inline-flex items-center rounded-[4px] border px-1.5 py-px font-mono text-[10px] font-semibold ${cls}`}>
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
      const interval = setInterval(() => router.refresh(), 5000);
      return () => clearInterval(interval);
    }
  }, [repos, router]);

  if (repos.length === 0) return <EmptyState />;

  return (
    <div className="pb-10">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-console-text">Bug Fixes</h1>
          {allBugs.length > 0 && (
            <p className="mt-0.5 text-[12px] text-console-faint">
              {allBugs.filter(b => b.severity === 'critical').length} critical · {allBugs.filter(b => b.severity === 'high').length} high · {allBugs.length} total
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
      ) : allBugs.length === 0 ? (
        <CleanState />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          {/* Sidebar list */}
          <div>
            <div className="mb-2.5 flex items-center justify-between text-[12px]">
              <span className="text-console-muted">Findings</span>
              <span className="text-console-rose">{allBugs.length} found</span>
            </div>
            <div className="divide-y divide-console-border rounded-[7px] border border-console-border overflow-hidden">
              {allBugs.map((bug, i) => (
                <button
                  key={`${bug.repoId}-${bug.category}-${bug.index}`}
                  onClick={() => setSelectedIdx(i)}
                  className={[
                    'flex w-full flex-col gap-1.5 px-3 py-2.5 text-left transition-colors hover:bg-console-bg-soft',
                    i === selectedIdx ? 'bg-console-bg-soft' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge tone={severityTone(bug.severity)}>{bug.severity ?? 'low'}</StatusBadge>
                      <ConfidenceBadge value={bug.confidence} />
                    </div>
                    <span className={`rounded-[4px] border px-1.5 py-px text-[9px] font-bold tracking-wide ${
                      bug.category === 'security'
                        ? 'text-rose-400 bg-rose-400/10 border-rose-400/25'
                        : 'text-amber-400 bg-amber-400/10 border-amber-400/25'
                    }`}>
                      {bug.category === 'security' ? 'SEC' : 'BUG'}
                    </span>
                  </div>
                  <div className="line-clamp-2 text-[12px] font-medium leading-snug text-console-text">
                    {bug.normalizedTitle}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-console-faint">
                    <FileCode size={9} />
                    <span className="truncate">{bug.repoName}</span>
                    {bug.file && (
                      <><ChevronRight size={9} /><span className="truncate font-mono">{bug.file.split('/').pop()}</span></>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          {activeBug && <BugDetail bug={activeBug} />}
        </div>
      )}
    </div>
  );
}

// ── Finding Detail ─────────────────────────────────────────────────────────────

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

  const impactBorderColor =
    bug.severity === 'critical' ? 'border-rose-400/30 bg-rose-400/[0.06]' :
    bug.severity === 'high'     ? 'border-amber-400/30 bg-amber-400/[0.06]' :
    bug.severity === 'medium'   ? 'border-sky-400/30 bg-sky-400/[0.05]' :
                                  'border-zinc-600/40 bg-zinc-400/[0.04]';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-[7px] border border-console-border px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge tone={severityTone(bug.severity)}>{bug.severity ?? 'low'}</StatusBadge>
            <span className={`inline-flex items-center rounded-[4px] border px-1.5 py-px text-[10px] font-semibold ${
              bug.category === 'security'
                ? 'text-rose-400 bg-rose-400/10 border-rose-400/25'
                : 'text-amber-400 bg-amber-400/10 border-amber-400/25'
            }`}>
              {bug.category === 'security' ? 'Security' : 'Bug'}
            </span>
            <ConfidenceBadge value={bug.confidence} />
            {bug.effort && <EffortBadge effort={bug.effort} />}
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
          {bug.normalizedTitle}
        </h2>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] text-console-faint">
          <span>{bug.repoName}</span>
          {bug.file && <><span>·</span><span className="text-console-muted">{bug.file}</span></>}
          {bug.line_hint && <><span>·</span><span>{bug.line_hint}</span></>}
        </div>
      </div>

      {/* Impact banner */}
      {bug.impact && (
        <div className={`rounded-[7px] border px-4 py-3 ${impactBorderColor}`}>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-console-faint">Impact</div>
          <p className="text-[13px] leading-relaxed text-console-text">{bug.impact}</p>
        </div>
      )}

      {/* Two-column: analysis + meta */}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_240px]">
        {/* Analysis column */}
        <div className="space-y-3">
          {/* Description */}
          {bug.description && (
            <Section title="Description">
              <p className="text-[12px] leading-relaxed text-console-muted">{bug.description}</p>
            </Section>
          )}

          {/* Root cause */}
          {bug.root_cause && (
            <Section title="Root Cause">
              <p className="text-[12px] leading-relaxed text-console-muted">{bug.root_cause}</p>
            </Section>
          )}

          {/* Exploitation path (security) */}
          {bug.exploitation_path && (
            <Section title="Exploitation Path">
              <p className="text-[12px] leading-relaxed text-console-muted">{bug.exploitation_path}</p>
            </Section>
          )}

          {/* Evidence */}
          {bug.evidence && (
            <div className="overflow-hidden rounded-[6px] border border-console-border">
              <div className="border-b border-console-border bg-white/[0.02] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-console-faint">
                Evidence
              </div>
              <pre className="overflow-x-auto px-4 py-3 font-mono text-[11px] leading-relaxed text-console-muted whitespace-pre-wrap bg-black/20">
                {bug.evidence}
              </pre>
            </div>
          )}

          {/* Recommendation */}
          {bug.recommendation && (
            <Section title="Recommendation">
              <p className="text-[12px] leading-relaxed text-console-text">{bug.recommendation}</p>
            </Section>
          )}
        </div>

        {/* Meta sidebar */}
        <div className="space-y-3">
          <div className="rounded-[7px] border border-console-border p-3">
            <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-console-faint">Details</div>
            <MetaRow label="Severity">
              <StatusBadge tone={severityTone(bug.severity)}>{bug.severity ?? 'low'}</StatusBadge>
            </MetaRow>
            {bug.confidence !== undefined && (
              <MetaRow label="Confidence">
                <ConfidenceBadge value={bug.confidence} />
              </MetaRow>
            )}
            {bug.effort && (
              <MetaRow label="Effort">
                <EffortBadge effort={bug.effort} />
              </MetaRow>
            )}
            {bug.fix_complexity && (
              <MetaRow label="Complexity">
                <span className="text-[11px] capitalize text-console-text">{bug.fix_complexity}</span>
              </MetaRow>
            )}
            {bug.file && (
              <MetaRow label="File">
                <span className="max-w-[140px] truncate text-right font-mono text-[10px] text-console-text" title={bug.file}>
                  {bug.file}
                </span>
              </MetaRow>
            )}
            <MetaRow label="Repository">
              <span className="text-[11px] text-console-text">{bug.repoName}</span>
            </MetaRow>
            <MetaRow label="Agent">
              <span className={`inline-flex items-center rounded-[4px] border px-1.5 py-px text-[9px] font-bold tracking-wide ${
                bug.category === 'security'
                  ? 'text-rose-400 bg-rose-400/10 border-rose-400/25'
                  : 'text-amber-400 bg-amber-400/10 border-amber-400/25'
              }`}>
                {bug.category === 'security' ? 'Security Agent' : 'Bug Agent'}
              </span>
            </MetaRow>
          </div>

          {/* Security classification */}
          {(bug.cwe || bug.owasp) && (
            <div className="rounded-[7px] border border-console-border p-3">
              <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-console-faint">Classification</div>
              {bug.cwe && (
                <MetaRow label="CWE">
                  <span className="font-mono text-[11px] text-rose-400">{bug.cwe}</span>
                </MetaRow>
              )}
              {bug.owasp && (
                <MetaRow label="OWASP">
                  <span className="text-right font-mono text-[10px] text-rose-400 max-w-[140px] text-wrap">{bug.owasp}</span>
                </MetaRow>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Utility Components ────────────────────────────────────────────────────────

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

// ── State Components ──────────────────────────────────────────────────────────

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
      <p className="text-[14px] font-medium text-console-text">No bugs or security issues found</p>
      <p className="mt-1 text-[12px] text-console-faint">Your repositories look clean — great work!</p>
    </div>
  );
}
