'use client';

import { useState, useEffect } from 'react';
import {
  Bot, Bug, ShieldCheck, Network, Code2, Package, BookOpen,
  Database, ArrowRight, AlertTriangle, CheckCircle2,
  Activity, Loader2, RefreshCw, ChevronDown, Zap, Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/console/Premium';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AgentStatus {
  agent: string;
  status: string;
  findings_count: number;
}

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
  // Security
  cwe?: string;
  owasp?: string;
  exploitation_path?: string;
  // Architecture
  affected_area?: string;
  current_pattern?: string;
  recommended_pattern?: string;
  // Review
  principle_violated?: string;
  // Dependency
  package?: string;
  current_version?: string;
  issue_type?: string;
  ecosystem?: string;
  cve?: string;
}

interface UnifiedFinding extends Finding {
  agent: string;
  normalizedTitle: string;
}

interface AgentResults {
  scores: {
    overall_score: number;
    security_score: number;
    bug_score: number;
    architecture_score: number;
    code_quality_score: number;
  };
  risk_level: string;
  summary: string;
  total_findings: number;
  critical_findings: number;
  findings: {
    bugs: Finding[];
    security: Finding[];
    architecture: Finding[];
    code_review: Finding[];
    dependencies: Finding[];
    documentation?: Finding[];
  };
  action_plan: Array<{
    category: string;
    action: string;
    severity: string;
    file: string;
    confidence?: number;
  }>;
  agents_run: string[];
  agent_statuses: AgentStatus[];
}

interface Repo {
  id: string;
  name: string;
  fullName: string;
  language: string | null;
  status: string;
  agentResults: AgentResults | null;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const AGENT_META: Record<string, { icon: any; color: string; label: string; short: string }> = {
  bug:          { icon: Bug,          color: 'text-amber-400',  label: 'Bug Agent',          short: 'BUG'  },
  security:     { icon: ShieldCheck,  color: 'text-rose-400',   label: 'Security Agent',     short: 'SEC'  },
  architecture: { icon: Network,      color: 'text-violet-400', label: 'Architecture Agent', short: 'ARCH' },
  review:       { icon: Code2,        color: 'text-sky-400',    label: 'Code Review Agent',  short: 'REV'  },
  dependency:   { icon: Package,      color: 'text-orange-400', label: 'Dependency Agent',   short: 'DEP'  },
  docs:         { icon: BookOpen,     color: 'text-cyan-400',   label: 'Docs Agent',         short: 'DOC'  },
};

const AGENT_BADGE_COLORS: Record<string, string> = {
  bug:          'text-amber-400  bg-amber-400/10  border-amber-400/25',
  security:     'text-rose-400   bg-rose-400/10   border-rose-400/25',
  architecture: 'text-violet-400 bg-violet-400/10 border-violet-400/25',
  review:       'text-sky-400    bg-sky-400/10    border-sky-400/25',
  dependency:   'text-orange-400 bg-orange-400/10 border-orange-400/25',
  docs:         'text-cyan-400   bg-cyan-400/10   border-cyan-400/25',
};

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const riskTone = (r: string) =>
  r === 'critical' ? 'rose' as const :
  r === 'high'     ? 'amber' as const :
  r === 'medium'   ? 'sky' as const   : 'emerald' as const;

const severityTone = (s?: string) =>
  s === 'critical' ? 'rose' as const :
  s === 'high'     ? 'amber' as const :
  s === 'medium'   ? 'sky' as const   : 'emerald' as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function flattenFindings(findings: AgentResults['findings']): UnifiedFinding[] {
  const all: UnifiedFinding[] = [];

  (findings.bugs ?? []).forEach(f => all.push({
    ...f, agent: 'bug',
    normalizedTitle: f.title ?? f.issue ?? 'Bug',
  }));
  (findings.security ?? []).forEach(f => all.push({
    ...f, agent: 'security',
    normalizedTitle: f.issue ?? f.title ?? 'Security Issue',
  }));
  (findings.architecture ?? []).forEach(f => all.push({
    ...f, agent: 'architecture',
    normalizedTitle: f.issue ?? f.title ?? 'Architecture Issue',
    file: f.file ?? (f as any).affected_area,
  }));
  (findings.code_review ?? []).forEach(f => all.push({
    ...f, agent: 'review',
    normalizedTitle: f.issue ?? f.title ?? 'Code Review Finding',
  }));
  (findings.dependencies ?? []).forEach(f => all.push({
    ...f, agent: 'dependency',
    normalizedTitle: f.package
      ? `${f.package}${f.current_version ? ` ${f.current_version}` : ''} — ${f.issue_type ?? 'issue'}`
      : (f.issue ?? f.title ?? 'Dependency Issue'),
  }));

  return all.sort((a, b) => {
    const s = (SEV_ORDER[a.severity ?? 'low'] ?? 3) - (SEV_ORDER[b.severity ?? 'low'] ?? 3);
    if (s !== 0) return s;
    return (b.confidence ?? 0) - (a.confidence ?? 0);
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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

function AgentBadge({ agent }: { agent: string }) {
  const meta = AGENT_META[agent];
  const cls = AGENT_BADGE_COLORS[agent] ?? AGENT_BADGE_COLORS.docs;
  return (
    <span className={`inline-flex items-center rounded-[4px] border px-1.5 py-px text-[9px] font-bold tracking-wide ${cls}`}>
      {meta?.short ?? agent.toUpperCase()}
    </span>
  );
}

function EffortBadge({ effort }: { effort?: string }) {
  if (!effort) return null;
  const map: Record<string, string> = {
    fix_now:  'text-rose-400  bg-rose-400/10  border-rose-400/25',
    fix_later:'text-amber-400 bg-amber-400/10 border-amber-400/25',
    optional: 'text-zinc-400  bg-zinc-400/10  border-zinc-400/25',
  };
  const label: Record<string, string> = { fix_now: 'Fix Now', fix_later: 'Fix Later', optional: 'Optional' };
  const cls = map[effort] ?? map.optional;
  return (
    <span className={`inline-flex items-center rounded-[4px] border px-1.5 py-px text-[10px] font-medium ${cls}`}>
      {label[effort] ?? effort}
    </span>
  );
}

function ScoreCard({ score, label, sub }: { score: number; label: string; sub?: string }) {
  const color =
    score >= 80 ? 'text-emerald-400' :
    score >= 60 ? 'text-amber-400'   : 'text-rose-400';
  const barColor =
    score >= 80 ? 'bg-emerald-400' :
    score >= 60 ? 'bg-amber-400'   : 'bg-rose-400';
  return (
    <div className="flex flex-col gap-2 rounded-[7px] border border-console-border px-3 py-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] text-console-muted">{label}</span>
        {sub && <span className="text-[9px] text-console-faint">{sub}</span>}
      </div>
      <div className={`text-[26px] font-bold leading-none tabular-nums ${color}`}>{score}</div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function SeverityBucket({ count, label, colorCls }: { count: number; label: string; colorCls: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-0.5 rounded-[7px] border px-3 py-3 ${colorCls}`}>
      <span className="text-[24px] font-bold leading-none tabular-nums">{count}</span>
      <span className="text-[9px] font-semibold uppercase tracking-widest opacity-75">{label}</span>
    </div>
  );
}

function FindingCard({ finding }: { finding: UnifiedFinding }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-[6px] border border-console-border">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
          <StatusBadge tone={severityTone(finding.severity)}>{finding.severity ?? 'low'}</StatusBadge>
          <ConfidenceBadge value={finding.confidence} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium text-console-text">{finding.normalizedTitle}</span>
            <AgentBadge agent={finding.agent} />
            {finding.effort && <EffortBadge effort={finding.effort} />}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            {finding.file && (
              <span className="truncate font-mono text-[10px] text-console-faint max-w-[280px]">{finding.file}</span>
            )}
            {finding.line_hint && (
              <span className="text-[10px] text-zinc-600">· {finding.line_hint}</span>
            )}
          </div>
          {finding.impact && (
            <p className="mt-1 line-clamp-1 text-[11px] leading-snug text-console-muted">{finding.impact}</p>
          )}
        </div>
        <ChevronDown
          size={13}
          className={`mt-0.5 shrink-0 text-console-faint transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-console-border bg-white/[0.01] px-4 py-3 space-y-3">
          {finding.impact && (
            <div className={`rounded-[5px] border px-3 py-2 text-[12px] leading-relaxed text-console-muted ${
              finding.severity === 'critical' ? 'border-rose-400/25 bg-rose-400/[0.05]' :
              finding.severity === 'high'     ? 'border-amber-400/25 bg-amber-400/[0.05]' :
                                                'border-sky-400/25 bg-sky-400/[0.04]'
            }`}>
              <span className="mr-2 text-[9px] font-bold uppercase tracking-widest opacity-60">Impact</span>
              {finding.impact}
            </div>
          )}
          {finding.evidence && (
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-console-faint">Evidence</div>
              <pre className="overflow-x-auto rounded-[5px] border border-console-border bg-black/30 px-3 py-2 font-mono text-[11px] leading-relaxed text-console-muted whitespace-pre-wrap">
                {finding.evidence}
              </pre>
            </div>
          )}
          {finding.recommendation && (
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-console-faint">Recommendation</div>
              <p className="text-[12px] leading-relaxed text-console-text">{finding.recommendation}</p>
            </div>
          )}
          {(finding.cwe || finding.owasp || finding.principle_violated) && (
            <div className="flex flex-wrap gap-1.5">
              {finding.cwe && (
                <span className="rounded-[4px] border border-rose-400/20 bg-rose-400/[0.06] px-2 py-0.5 font-mono text-[10px] text-rose-400">
                  {finding.cwe}
                </span>
              )}
              {finding.owasp && (
                <span className="rounded-[4px] border border-rose-400/20 bg-rose-400/[0.06] px-2 py-0.5 font-mono text-[10px] text-rose-400">
                  {finding.owasp}
                </span>
              )}
              {finding.principle_violated && (
                <span className="rounded-[4px] border border-sky-400/20 bg-sky-400/[0.06] px-2 py-0.5 font-mono text-[10px] text-sky-400">
                  {finding.principle_violated}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AgentsClient({ repos }: { repos: Repo[] }) {
  const [selectedId, setSelectedId] = useState<string>(repos[0]?.id ?? '');
  const selectedRepo = repos.find((r) => r.id === selectedId) ?? repos[0];
  const indexedRepos = repos.filter((r) => r.status === 'completed');
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

  return (
    <div className="pb-10">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-console-text">AI Agents</h1>
        <Link
          href="/console/repositories"
          className="flex items-center gap-1.5 rounded-[6px] bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          <Bot size={12} />
          Add Repository
        </Link>
      </div>

      {repos.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
          {/* Repo list */}
          <div>
            <div className="mb-2.5 flex items-center justify-between text-[12px]">
              <span className="text-console-muted">Repositories</span>
              <span className="text-console-emerald">{indexedRepos.length} indexed</span>
            </div>
            <div className="divide-y divide-console-border rounded-[7px] border border-console-border">
              {repos.map((repo) => {
                const hasAnalysis = !!repo.agentResults;
                const active = repo.id === selectedRepo?.id;
                return (
                  <button
                    key={repo.id}
                    onClick={() => setSelectedId(repo.id)}
                    className={[
                      'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-console-bg-soft',
                      active ? 'bg-console-bg-soft' : '',
                    ].join(' ')}
                  >
                    <Database size={13} className="shrink-0 text-console-faint" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-medium text-console-text">{repo.name}</div>
                      <div className="mt-0.5 text-[11px] text-console-faint">
                        {repo.language ?? 'Unknown'} · {repo.status}
                      </div>
                    </div>
                    {hasAnalysis ? (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    ) : repo.status === 'running' || repo.status === 'pending' ? (
                      <Loader2 size={11} className="shrink-0 animate-spin text-sky-400" />
                    ) : (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          <div>
            {selectedRepo ? <RepoAnalysisPanel repo={selectedRepo} /> : <EmptyState />}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Empty / Loading States ────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[7px] border border-console-border">
      <Bot size={32} className="mb-3 text-zinc-600" />
      <p className="text-[14px] font-medium text-console-text">No repositories indexed yet</p>
      <p className="mt-1 text-[12px] text-console-faint">Import and sync a repository to activate AI agents</p>
      <Link
        href="/console/repositories"
        className="mt-4 flex items-center gap-1.5 rounded-[6px] bg-white px-4 py-2 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200"
      >
        Go to Repositories <ArrowRight size={11} />
      </Link>
    </div>
  );
}

// ── Main Analysis Panel ───────────────────────────────────────────────────────

function RepoAnalysisPanel({ repo }: { repo: Repo }) {
  const { agentResults, status } = repo;
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const router = useRouter();

  const handleReanalyze = async () => {
    if (isReanalyzing) return;
    setIsReanalyzing(true);
    try {
      await fetch(`/api/repositories/${repo.id}/analysis`, { method: 'POST' });
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsReanalyzing(false);
    }
  };

  if (!agentResults) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[7px] border border-console-border">
        {status === 'completed' ? (
          <>
            <Activity size={28} className="mb-3 animate-pulse text-sky-400" />
            <p className="text-[14px] font-medium text-console-text">Agent analysis running…</p>
            <p className="mt-1 text-[12px] text-console-faint">
              Agents are analyzing {repo.name}. Refresh in a moment.
            </p>
            <button
              onClick={handleReanalyze}
              disabled={isReanalyzing}
              className="mt-4 flex items-center gap-1.5 rounded-[5px] bg-white/[0.05] px-4 py-2 text-[12px] font-medium text-console-text transition-colors hover:bg-white/[0.1] disabled:opacity-50"
            >
              {isReanalyzing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Force Re-analyze
            </button>
          </>
        ) : status === 'running' || status === 'pending' ? (
          <>
            <Loader2 size={28} className="mb-3 animate-spin text-sky-400" />
            <p className="text-[14px] font-medium text-console-text">Indexing in progress…</p>
            <p className="mt-1 text-[12px] text-console-faint">Agent analysis starts once indexing completes.</p>
            <Link
              href={`/console/repositories/${repo.id}/onboarding`}
              className="mt-4 flex items-center gap-1.5 text-[12px] text-sky-400 hover:underline"
            >
              View progress <ArrowRight size={11} />
            </Link>
          </>
        ) : (
          <>
            <AlertTriangle size={28} className="mb-3 text-amber-400" />
            <p className="text-[14px] font-medium text-console-text">Analysis not available</p>
            <p className="mt-1 text-[12px] text-console-faint">The analysis may have failed or was interrupted.</p>
            <button
              onClick={handleReanalyze}
              disabled={isReanalyzing}
              className="mt-4 flex items-center gap-1.5 rounded-[5px] bg-white/[0.05] px-4 py-2 text-[12px] font-medium text-console-text transition-colors hover:bg-white/[0.1] disabled:opacity-50"
            >
              {isReanalyzing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Force Re-analyze
            </button>
          </>
        )}
      </div>
    );
  }

  const { scores, risk_level, summary, total_findings, critical_findings, agent_statuses, action_plan, findings } = agentResults;
  const allFindings = flattenFindings(findings);

  const counts = {
    critical: allFindings.filter(f => f.severity === 'critical').length,
    high:     allFindings.filter(f => f.severity === 'high').length,
    medium:   allFindings.filter(f => f.severity === 'medium').length,
    low:      allFindings.filter(f => f.severity === 'low').length,
  };

  const filtered = severityFilter === 'all'
    ? allFindings
    : allFindings.filter(f => f.severity === severityFilter);

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="rounded-[7px] border border-console-border px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-console-faint">{repo.fullName}</p>
            <h2 className="mt-1 text-[15px] font-semibold text-console-text">{repo.name}</h2>
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-console-muted">{summary}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusBadge tone={riskTone(risk_level)}>{risk_level} risk</StatusBadge>
            <button
              onClick={handleReanalyze}
              disabled={isReanalyzing}
              className="flex items-center gap-1.5 rounded-[5px] bg-white/[0.05] px-3 py-1.5 text-[11px] font-medium text-console-text transition-colors hover:bg-white/[0.1] disabled:opacity-50"
            >
              {isReanalyzing ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              Re-analyze
            </button>
          </div>
        </div>
      </div>

      {/* ── Health Scores ── */}
      <div className="grid grid-cols-5 gap-2.5">
        <ScoreCard score={scores.overall_score}      label="Overall"       sub="health" />
        <ScoreCard score={scores.security_score}     label="Security"      sub="score" />
        <ScoreCard score={scores.bug_score}          label="Bugs"          sub="score" />
        <ScoreCard score={scores.architecture_score} label="Architecture"  sub="score" />
        <ScoreCard score={scores.code_quality_score} label="Code Quality"  sub="score" />
      </div>

      {/* ── Severity Overview + Agent Activity ── */}
      <div className="grid gap-3 xl:grid-cols-[1fr_220px]">
        <div className="grid grid-cols-4 gap-2.5">
          <SeverityBucket count={counts.critical} label="Critical"
            colorCls="border-rose-400/30 bg-rose-400/[0.06] text-rose-400" />
          <SeverityBucket count={counts.high} label="High"
            colorCls="border-amber-400/30 bg-amber-400/[0.06] text-amber-400" />
          <SeverityBucket count={counts.medium} label="Medium"
            colorCls="border-sky-400/30 bg-sky-400/[0.06] text-sky-400" />
          <SeverityBucket count={counts.low} label="Low"
            colorCls="border-zinc-600/60 bg-zinc-400/[0.04] text-zinc-400" />
        </div>

        <div className="rounded-[7px] border border-console-border p-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-console-faint">Agent Activity</div>
          <div className="space-y-1.5">
            {agent_statuses.map((a) => {
              const meta = AGENT_META[a.agent] ?? AGENT_META.docs;
              const Icon = meta.icon;
              return (
                <div key={a.agent} className="flex items-center gap-2">
                  <Icon size={11} className={`shrink-0 ${meta.color}`} />
                  <span className="flex-1 text-[11px] text-console-muted">{meta.label}</span>
                  <span className="tabular-nums text-[10px] text-console-faint">{a.findings_count}</span>
                  {a.status === 'completed'
                    ? <CheckCircle2 size={11} className="shrink-0 text-emerald-400" />
                    : <Clock size={11} className="shrink-0 text-zinc-600" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Findings ── */}
      <div className="rounded-[7px] border border-console-border overflow-hidden">
        {/* Filter tabs */}
        <div className="flex items-center gap-0 border-b border-console-border bg-white/[0.01]">
          {[
            { key: 'all',      label: `All  ${total_findings}` },
            { key: 'critical', label: `Critical  ${counts.critical}` },
            { key: 'high',     label: `High  ${counts.high}` },
            { key: 'medium',   label: `Medium  ${counts.medium}` },
            { key: 'low',      label: `Low  ${counts.low}` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSeverityFilter(tab.key)}
              className={[
                'px-4 py-2.5 text-[11px] font-medium transition-colors border-b-2 -mb-px',
                severityFilter === tab.key
                  ? 'border-console-text text-console-text'
                  : 'border-transparent text-console-faint hover:text-console-muted',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Finding cards */}
        <div className="p-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-[12px] text-console-faint justify-center">
              <CheckCircle2 size={14} className="text-emerald-400" />
              No findings at this severity level
            </div>
          ) : (
            filtered.map((f, i) => <FindingCard key={i} finding={f} />)
          )}
        </div>
      </div>

      {/* ── Action Plan ── */}
      {action_plan.length > 0 && (
        <div className="rounded-[7px] border border-console-border p-3">
          <div className="mb-3 flex items-center gap-2">
            <Zap size={12} className="text-amber-400" />
            <span className="text-[12px] font-semibold text-console-muted">Action Plan</span>
            <span className="ml-auto rounded-full bg-white/[0.06] px-2 py-px text-[10px] text-console-faint">
              {action_plan.length} items
            </span>
          </div>
          <div className="space-y-2">
            {action_plan.slice(0, 10).map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-[5px] bg-white/[0.02] px-3 py-2">
                <StatusBadge tone={severityTone(item.severity)}>{item.severity}</StatusBadge>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] leading-snug text-console-text">{item.action}</p>
                  {item.file && (
                    <p className="mt-0.5 truncate font-mono text-[10px] text-console-faint">{item.file}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-[4px] border border-console-border px-1.5 py-px text-[10px] text-console-faint capitalize">
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
