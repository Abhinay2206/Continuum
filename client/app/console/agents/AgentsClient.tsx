'use client';

import { useState, useEffect } from 'react';
import {
  Bot, Bug, ShieldCheck, Network, Code2, Package, BookOpen,
  Database, ArrowRight, AlertTriangle, CheckCircle2, Clock,
  Activity, Loader2, RefreshCw
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
  description?: string;
  recommendation?: string;
  file?: string;
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
  };
  action_plan: Array<{
    category: string;
    action: string;
    severity: string;
    file: string;
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

// ── Helpers ────────────────────────────────────────────────────────────────────

const AGENT_META: Record<string, { icon: any; color: string; label: string }> = {
  bug:          { icon: Bug,          color: 'text-amber-400',   label: 'Bug Agent' },
  security:     { icon: ShieldCheck,  color: 'text-rose-400',    label: 'Security Agent' },
  architecture: { icon: Network,      color: 'text-violet-400',  label: 'Architecture Agent' },
  review:       { icon: Code2,        color: 'text-sky-400',     label: 'Code Review Agent' },
  dependency:   { icon: Package,      color: 'text-orange-400',  label: 'Dependency Agent' },
  docs:         { icon: BookOpen,     color: 'text-cyan-400',    label: 'Docs Agent' },
};

const riskTone = (r: string) =>
  r === 'critical' ? 'rose' as const :
  r === 'high'     ? 'amber' as const :
  r === 'medium'   ? 'sky' as const   : 'emerald' as const;

const severityTone = (s: string) =>
  s === 'critical' ? 'rose' as const :
  s === 'high'     ? 'amber' as const :
  s === 'medium'   ? 'sky' as const   : 'emerald' as const;

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" width="56" height="56" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
          <circle
            cx="28" cy="28" r="22" fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={`${(score / 100) * 138.2} 138.2`}
            strokeLinecap="round"
          />
        </svg>
        <span className="text-[13px] font-semibold text-console-text">{score}</span>
      </div>
      <span className="text-[10px] text-console-faint text-center leading-tight">{label}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AgentsClient({ repos }: { repos: Repo[] }) {
  const [selectedId, setSelectedId] = useState<string>(repos[0]?.id ?? '');
  const selectedRepo = repos.find((r) => r.id === selectedId) ?? repos[0];

  const indexedRepos = repos.filter((r) => r.status === 'completed');
  const router = useRouter();

  // Poll for updates if any repo is currently running analysis
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
        <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
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
            {selectedRepo ? (
              <RepoAnalysisPanel repo={selectedRepo} />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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

function RepoAnalysisPanel({ repo }: { repo: Repo }) {
  const { agentResults, status } = repo;
  const [isReanalyzing, setIsReanalyzing] = useState(false);
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
              Agents are analyzing {repo.name} in the background. Refresh in a moment.
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-[7px] border border-console-border px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-console-faint">{repo.fullName}</p>
            <h2 className="mt-1 text-[15px] font-semibold text-console-text">{repo.name}</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-console-muted line-clamp-2">{summary}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
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

        {/* Score rings */}
        <div className="mt-4 flex flex-wrap items-center gap-6 border-t border-console-border pt-4">
          <ScoreRing score={scores.overall_score}      label="Overall" />
          <ScoreRing score={scores.security_score}     label="Security" />
          <ScoreRing score={scores.bug_score}          label="Bugs" />
          <ScoreRing score={scores.architecture_score} label="Architecture" />
          <ScoreRing score={scores.code_quality_score} label="Code Quality" />
          <div className="ml-auto flex flex-col items-end gap-1 text-right">
            <div className="text-[22px] font-bold text-console-text">{total_findings}</div>
            <div className="text-[11px] text-console-faint">total findings</div>
            {critical_findings > 0 && (
              <div className="text-[11px] text-rose-400">{critical_findings} critical/high</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
        {/* Action plan */}
        <div className="rounded-[7px] border border-console-border p-3">
          <div className="mb-3 text-[12px] font-semibold text-console-muted">Action Plan</div>
          {action_plan.length === 0 ? (
            <div className="flex items-center gap-2 text-[12px] text-console-faint">
              <CheckCircle2 size={13} className="text-emerald-400" />
              No critical actions needed - repository is in good health.
            </div>
          ) : (
            <div className="space-y-2">
              {action_plan.slice(0, 8).map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-[5px] bg-white/[0.02] px-3 py-2">
                  <StatusBadge tone={severityTone(item.severity)}>{item.severity}</StatusBadge>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-console-text leading-snug">{item.action}</p>
                    {item.file && (
                      <p className="mt-0.5 truncate font-mono text-[10px] text-console-faint">{item.file}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent statuses */}
        <div className="space-y-3">
          <div className="rounded-[7px] border border-console-border p-3">
            <div className="mb-2 text-[12px] font-semibold text-console-muted">Agents run</div>
            <div className="space-y-2">
              {agent_statuses.map((a) => {
                const meta = AGENT_META[a.agent] ?? AGENT_META['docs'];
                const Icon = meta.icon;
                return (
                  <div key={a.agent} className="flex items-center gap-2.5">
                    <Icon size={12} className={meta.color} />
                    <span className="flex-1 text-[12px] text-console-muted">{meta.label}</span>
                    <span className="text-[11px] text-console-faint">{a.findings_count} found</span>
                    {a.status === 'completed' ? (
                      <CheckCircle2 size={11} className="text-emerald-400" />
                    ) : (
                      <Clock size={11} className="text-zinc-600" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Findings breakdown */}
          {findings && (
            <div className="rounded-[7px] border border-console-border p-3">
              <div className="mb-2 text-[12px] font-semibold text-console-muted">Findings breakdown</div>
              <div className="space-y-1.5">
                {[
                  { label: 'Bugs',         count: findings.bugs?.length ?? 0,         color: 'bg-amber-400' },
                  { label: 'Security',     count: findings.security?.length ?? 0,     color: 'bg-rose-400' },
                  { label: 'Architecture', count: findings.architecture?.length ?? 0, color: 'bg-violet-400' },
                  { label: 'Code Review',  count: findings.code_review?.length ?? 0,  color: 'bg-sky-400' },
                  { label: 'Dependencies', count: findings.dependencies?.length ?? 0, color: 'bg-orange-400' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center gap-2 text-[12px]">
                    <span className={`h-2 w-2 rounded-full ${color}`} />
                    <span className="flex-1 text-console-muted">{label}</span>
                    <span className="font-medium text-console-text">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
