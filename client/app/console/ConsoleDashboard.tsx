'use client';

import {
  ArrowRight, ArrowUpRight, Bot, Bug, CheckCircle2, Circle,
  Database, GitPullRequest, Loader2, Network, Package,
  Plus, ShieldCheck, Zap, Activity, Code2,
} from 'lucide-react';
import { useUser } from '@/components/providers/UserProvider';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { ImportModal } from '@/components/dashboard/ImportModal';

// ── Types ──────────────────────────────────────────────────────────────────────

interface RepoMetrics {
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
  security_count: number;
  bug_count: number;
  agents_run: string[];
}

interface Repo {
  id: string;
  name: string;
  fullName: string;
  language: string | null;
  status: string;
  agentResults: RepoMetrics | null;
}

interface Metrics {
  totalRepos: number;
  health: number;
  avgScore: number;
  avgSecurityScore: number;
  totalCritical: number;
  totalFindings: number;
  totalSecurityIssues: number;
  totalBugIssues: number;
  analyzedCount: number;
  indexingCount: number;
}

interface ActivityEvent {
  title: string;
  repo: string;
  time: string;
  status: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const riskColor = (r: string) =>
  r === 'critical' ? 'text-rose-400' :
  r === 'high'     ? 'text-amber-400' :
  r === 'medium'   ? 'text-sky-400'   : 'text-emerald-400';

const riskBg = (r: string) =>
  r === 'critical' ? 'bg-rose-400/10 border-rose-400/25 text-rose-400' :
  r === 'high'     ? 'bg-amber-400/10 border-amber-400/25 text-amber-400' :
  r === 'medium'   ? 'bg-sky-400/10 border-sky-400/25 text-sky-400' :
                     'bg-emerald-400/10 border-emerald-400/25 text-emerald-400';

const scoreColor = (s: number) =>
  s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';

const scoreTailwind = (s: number) =>
  s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-amber-400' : 'text-rose-400';

const statusDot = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-emerald-400';
    case 'running':
    case 'pending':   return 'bg-sky-400 animate-pulse';
    case 'failed':    return 'bg-rose-400';
    default:          return 'bg-zinc-700';
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'completed': return 'Analyzed';
    case 'running':   return 'Analyzing';
    case 'pending':   return 'Queued';
    case 'failed':    return 'Failed';
    default:          return 'Not started';
  }
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, subColor = 'text-zinc-600', accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  subColor?: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[8px] border border-white/[0.07] bg-white/[0.015] px-4 py-3.5 transition-colors hover:bg-white/[0.025]">
      <div className="text-[11px] font-medium text-zinc-500">{label}</div>
      <div className={`text-[28px] font-semibold leading-none tracking-[-0.03em] ${accent ?? 'text-white'}`}>
        {value}
      </div>
      {sub && <div className={`text-[11px] ${subColor}`}>{sub}</div>}
    </div>
  );
}

function ScoreMini({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1 w-[52px] overflow-hidden rounded-full bg-white/[0.07]">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className={`w-6 text-right text-[11px] tabular-nums font-medium ${scoreTailwind(score)}`}>{score}</span>
    </div>
  );
}

function RepoRow({ repo }: { repo: Repo }) {
  const ar = repo.agentResults;
  const isIndexing = repo.status === 'running' || repo.status === 'pending';

  return (
    <Link
      href={`/console/agents`}
      className="group flex items-center gap-4 px-4 py-2.5 transition-colors hover:bg-white/[0.025]"
    >
      {/* Status dot */}
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot(repo.status)}`} />

      {/* Name + language */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
            {repo.name}
          </span>
          {repo.language && (
            <span className="shrink-0 rounded-[4px] border border-white/[0.07] bg-white/[0.04] px-1.5 py-px text-[10px] text-zinc-500">
              {repo.language}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[11px] text-zinc-600">
          {statusLabel(repo.status)}
          {ar && <> · {ar.total_findings} findings</>}
        </div>
      </div>

      {/* Health score */}
      <div className="hidden sm:block">
        {ar ? (
          <ScoreMini score={ar.scores.overall_score} />
        ) : isIndexing ? (
          <Loader2 size={11} className="animate-spin text-sky-400" />
        ) : (
          <span className="text-[11px] text-zinc-700">—</span>
        )}
      </div>

      {/* Critical count */}
      <div className="w-[52px] text-right">
        {ar && ar.critical_findings > 0 ? (
          <span className="inline-flex items-center rounded-[4px] border border-rose-400/25 bg-rose-400/[0.07] px-1.5 py-px text-[11px] font-medium text-rose-400">
            {ar.critical_findings} crit
          </span>
        ) : ar ? (
          <span className="text-[11px] text-zinc-700">clean</span>
        ) : null}
      </div>

      {/* Security score */}
      <div className="hidden xl:block w-[52px]">
        {ar ? (
          <ScoreMini score={ar.scores.security_score} />
        ) : null}
      </div>

      {/* Risk badge */}
      <div className="hidden lg:block">
        {ar ? (
          <span className={`inline-flex items-center rounded-[4px] border px-1.5 py-px text-[10px] font-medium capitalize ${riskBg(ar.risk_level)}`}>
            {ar.risk_level}
          </span>
        ) : null}
      </div>

      <ArrowUpRight size={12} className="shrink-0 text-zinc-700 opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

function ActivityItem({ event, last }: { event: ActivityEvent; last: boolean }) {
  const color =
    event.status === 'completed' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
    event.status === 'failed'    ? 'text-rose-400 bg-rose-400/10 border-rose-400/20' :
    event.status === 'running'   ? 'text-sky-400 bg-sky-400/10 border-sky-400/20' :
                                   'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';

  const Icon =
    event.status === 'completed' ? CheckCircle2 :
    event.status === 'failed'    ? Bug :
    event.status === 'running'   ? Loader2 : Circle;

  return (
    <div className="relative flex items-start gap-3 py-2">
      {!last && (
        <div className="absolute left-[11px] top-7 h-[calc(100%-8px)] w-px bg-white/[0.05]" />
      )}
      <div className={`z-10 mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border ${color}`}>
        <Icon size={10} strokeWidth={2} className={event.status === 'running' ? 'animate-spin' : ''} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium text-zinc-300">{event.title}</div>
        <div className="mt-px flex items-center gap-1.5 text-[11px] text-zinc-600">
          <span className="font-mono truncate max-w-[100px]">{event.repo}</span>
          <span>·</span>
          <span>{event.time}</span>
        </div>
      </div>
    </div>
  );
}

// ── Empty onboarding state ─────────────────────────────────────────────────────

function OnboardingDashboard({
  githubConnected,
  onImport,
}: {
  githubConnected: boolean;
  onImport: () => void;
}) {
  const steps = [
    { label: 'Account created', done: true },
    { label: 'GitHub connected', done: githubConnected },
    { label: 'First repository imported', done: false },
    { label: 'Repository indexed', done: false },
    { label: 'AI agents activated', done: false },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      {/* Welcome card */}
      <div className="flex flex-col items-center justify-center rounded-[8px] border border-white/[0.07] bg-white/[0.015] px-8 py-14 text-center">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[8px] border border-white/[0.1] bg-white/[0.05]">
          <Zap size={20} className="text-white" />
        </div>
        <h2 className="text-[18px] font-semibold text-white">Connect your first repository</h2>
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-zinc-500">
          Import a repository to begin AI-powered bug detection, security analysis, and architecture mapping.
        </p>
        <div className="mt-7 flex items-center gap-3">
          {!githubConnected ? (
            <button
              onClick={() => signIn('github')}
              className="flex items-center gap-2 rounded-[7px] bg-white px-5 py-2.5 text-[13px] font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              Connect GitHub <ArrowRight size={13} />
            </button>
          ) : (
            <button
              onClick={onImport}
              className="flex items-center gap-2 rounded-[7px] bg-white px-5 py-2.5 text-[13px] font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              <Plus size={13} />
              Import Repository
            </button>
          )}
        </div>

        {/* Agent capabilities preview */}
        <div className="mt-10 grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            { icon: Bug,         label: 'Bug Detection',     color: 'text-amber-400' },
            { icon: ShieldCheck, label: 'Security Scan',      color: 'text-rose-400' },
            { icon: Network,     label: 'Architecture Map',   color: 'text-violet-400' },
            { icon: Code2,       label: 'Code Review',        color: 'text-sky-400' },
            { icon: Package,     label: 'Dep Analysis',       color: 'text-orange-400' },
            { icon: Bot,         label: 'AI Insights',        color: 'text-cyan-400' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2 rounded-[6px] border border-white/[0.06] bg-white/[0.025] px-3 py-2">
              <Icon size={12} className={`shrink-0 ${color}`} />
              <span className="text-[11px] text-zinc-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Onboarding steps */}
      <div className="rounded-[8px] border border-white/[0.07] bg-white/[0.015] p-5">
        <div className="mb-5 text-[12px] font-semibold text-zinc-400 uppercase tracking-wide">
          Getting Started
        </div>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              {step.done ? (
                <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
              ) : (
                <div className="flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border border-zinc-700">
                  <span className="text-[9px] text-zinc-700">{i + 1}</span>
                </div>
              )}
              <span className={`text-[13px] ${step.done ? 'text-zinc-300' : 'text-zinc-600'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[6px] border border-white/[0.06] bg-white/[0.025] p-3">
          <div className="text-[11px] font-medium text-zinc-500">Onboarding progress</div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${(steps.filter(s => s.done).length / steps.length) * 100}%` }}
            />
          </div>
          <div className="mt-1.5 text-right text-[10px] text-zinc-600">
            {steps.filter(s => s.done).length} / {steps.length} complete
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export function ConsoleDashboard({
  repositories,
  metrics,
  recentActivity,
}: {
  repositories: Repo[];
  metrics: Metrics;
  recentActivity: ActivityEvent[];
}) {
  const { user, githubConnected } = useUser();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const isAnyIndexing = metrics.indexingCount > 0;
  const hasAnalyzed = metrics.analyzedCount > 0;
  const systemStatus = isAnyIndexing ? 'Analyzing' : hasAnalyzed ? 'Operational' : repositories.length > 0 ? 'Ready' : 'Setup required';
  const systemDotColor = isAnyIndexing ? 'bg-sky-400 animate-pulse' : hasAnalyzed ? 'bg-emerald-400' : 'bg-zinc-600';

  if (repositories.length === 0) {
    return (
      <div className="pb-10">
        <PageHeader
          user={user}
          systemStatus={systemStatus}
          systemDotColor={systemDotColor}
          metrics={metrics}
          onImport={() => setIsImportModalOpen(true)}
        />
        <OnboardingDashboard
          githubConnected={githubConnected}
          onImport={() => setIsImportModalOpen(true)}
        />
        <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      </div>
    );
  }

  const criticalRepos = repositories.filter(r => r.agentResults?.risk_level === 'critical' || r.agentResults?.risk_level === 'high');

  return (
    <div className="pb-10 space-y-6">
      {/* ── Header ── */}
      <PageHeader
        user={user}
        systemStatus={systemStatus}
        systemDotColor={systemDotColor}
        metrics={metrics}
        onImport={() => setIsImportModalOpen(true)}
      />

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          label="Platform Health"
          value={hasAnalyzed ? metrics.avgScore : '—'}
          accent={hasAnalyzed ? scoreTailwind(metrics.avgScore) : 'text-zinc-600'}
          sub={hasAnalyzed ? `${metrics.analyzedCount}/${metrics.totalRepos} repos analyzed` : 'No analysis yet'}
          subColor={hasAnalyzed && metrics.avgScore < 70 ? 'text-amber-500' : 'text-zinc-600'}
        />
        <MetricCard
          label="Critical Issues"
          value={hasAnalyzed ? metrics.totalCritical : '—'}
          accent={metrics.totalCritical > 0 ? 'text-rose-400' : hasAnalyzed ? 'text-emerald-400' : 'text-zinc-600'}
          sub={
            !hasAnalyzed ? 'Run analysis first' :
            metrics.totalCritical > 0 ? 'Immediate action required' : 'No critical issues'
          }
          subColor={metrics.totalCritical > 0 ? 'text-rose-500' : 'text-zinc-600'}
        />
        <MetricCard
          label="Security Score"
          value={hasAnalyzed ? metrics.avgSecurityScore : '—'}
          accent={hasAnalyzed ? scoreTailwind(metrics.avgSecurityScore) : 'text-zinc-600'}
          sub={hasAnalyzed ? `${metrics.totalSecurityIssues} vulnerabilities found` : 'No analysis yet'}
          subColor={metrics.totalSecurityIssues > 0 ? 'text-rose-500' : 'text-zinc-600'}
        />
        <MetricCard
          label="Total Findings"
          value={hasAnalyzed ? metrics.totalFindings : '—'}
          sub={
            !hasAnalyzed ? 'No analysis yet' :
            `${metrics.totalBugIssues} bugs · ${metrics.totalSecurityIssues} vulns`
          }
          subColor="text-zinc-600"
        />
      </div>

      {/* ── Alert banner if critical repos ── */}
      {criticalRepos.length > 0 && (
        <div className="flex items-center justify-between rounded-[7px] border border-rose-400/20 bg-rose-400/[0.05] px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            <span className="text-[12px] font-medium text-rose-300">
              {criticalRepos.length} {criticalRepos.length === 1 ? 'repository requires' : 'repositories require'} immediate attention
            </span>
            <span className="hidden text-[11px] text-rose-400/60 sm:block">
              — critical or high risk findings detected
            </span>
          </div>
          <Link
            href="/console/bugs"
            className="flex items-center gap-1 text-[11px] font-medium text-rose-400 hover:text-rose-300 transition-colors"
          >
            View issues <ArrowUpRight size={11} />
          </Link>
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="grid gap-5 xl:grid-cols-[1fr_260px]">

        {/* Repository health table */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[13px] font-semibold text-zinc-200">Repository Health</h2>
              {hasAnalyzed && (
                <p className="mt-0.5 text-[11px] text-zinc-600">{metrics.analyzedCount} analyzed · {metrics.indexingCount} indexing</p>
              )}
            </div>
            <Link href="/console/repositories" className="flex items-center gap-1 text-[11px] text-zinc-600 transition-colors hover:text-zinc-400">
              View all <ArrowUpRight size={11} />
            </Link>
          </div>

          <div className="overflow-hidden rounded-[8px] border border-white/[0.07]">
            {/* Table header */}
            <div className="hidden grid-cols-[1fr_120px_80px_100px_80px] gap-4 border-b border-white/[0.05] bg-white/[0.02] px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 sm:grid">
              <span>Repository</span>
              <span className="text-right">Health</span>
              <span className="text-right">Critical</span>
              <span className="hidden xl:block">Security</span>
              <span className="hidden lg:block">Risk</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/[0.05]">
              {repositories.map(repo => (
                <RepoRow key={repo.id} repo={repo} />
              ))}
            </div>
          </div>

          {/* Quick action row */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { href: '/console/bugs',         icon: Bug,         label: 'Bug Fixes',      count: metrics.totalBugIssues,       color: 'text-amber-400' },
              { href: '/console/agents',        icon: ShieldCheck, label: 'Security',       count: metrics.totalSecurityIssues,  color: 'text-rose-400' },
              { href: '/console/architecture',  icon: Network,     label: 'Architecture',   count: null,                         color: 'text-violet-400' },
            ].map(({ href, icon: Icon, label, count, color }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center justify-between rounded-[7px] border border-white/[0.07] bg-white/[0.015] px-3 py-2.5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-2">
                  <Icon size={12} className={`shrink-0 ${color}`} />
                  <span className="text-[12px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">{label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {count !== null && count > 0 && (
                    <span className="tabular-nums text-[11px] text-zinc-500">{count}</span>
                  )}
                  <ArrowUpRight size={11} className="text-zinc-700 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Right column */}
        <div className="space-y-4">
          {/* Recent activity */}
          <div className="rounded-[8px] border border-white/[0.07] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wide">Activity</h2>
            </div>
            {recentActivity.length === 0 ? (
              <p className="text-[12px] text-zinc-600">No recent activity.</p>
            ) : (
              <div>
                {recentActivity.map((event, i) => (
                  <ActivityItem key={i} event={event} last={i === recentActivity.length - 1} />
                ))}
              </div>
            )}
          </div>

          {/* Agent capabilities */}
          <div className="rounded-[8px] border border-white/[0.07] p-4">
            <div className="mb-3 text-[12px] font-semibold text-zinc-400 uppercase tracking-wide">
              AI Agents
            </div>
            <div className="space-y-1.5">
              {[
                { icon: Bug,         label: 'Bug Detection',     href: '/console/bugs',         color: 'text-amber-400' },
                { icon: ShieldCheck, label: 'Security',           href: '/console/agents',       color: 'text-rose-400' },
                { icon: Network,     label: 'Architecture',       href: '/console/architecture', color: 'text-violet-400' },
                { icon: Code2,       label: 'Code Review',        href: '/console/prs',          color: 'text-sky-400' },
                { icon: Package,     label: 'Dependencies',       href: '/console/agents',       color: 'text-orange-400' },
              ].map(({ icon: Icon, label, href, color }) => (
                <Link
                  key={label}
                  href={href}
                  className="group flex items-center justify-between rounded-[5px] px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={11} className={`shrink-0 ${color}`} />
                    <span className="text-[12px] text-zinc-500 group-hover:text-zinc-300 transition-colors">{label}</span>
                  </div>
                  <span className="text-[10px] text-zinc-700">
                    {hasAnalyzed ? 'Active' : 'Waiting'}
                  </span>
                </Link>
              ))}
            </div>

            {!hasAnalyzed && repositories.length > 0 && (
              <div className="mt-3 rounded-[5px] border border-sky-400/20 bg-sky-400/[0.05] px-3 py-2">
                <p className="text-[11px] leading-relaxed text-sky-400/80">
                  {metrics.indexingCount > 0
                    ? `${metrics.indexingCount} repo${metrics.indexingCount > 1 ? 's' : ''} indexing — agents will run automatically.`
                    : 'Trigger analysis from the AI Agents page.'}
                </p>
              </div>
            )}
          </div>

          {/* Import button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-[7px] border border-white/[0.07] bg-white/[0.015] px-4 py-2.5 text-[12px] font-medium text-zinc-400 transition-colors hover:border-white/[0.14] hover:bg-white/[0.04] hover:text-zinc-200"
          >
            <Plus size={12} />
            Import Repository
          </button>
        </div>
      </div>

      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </div>
  );
}

// ── Page Header ────────────────────────────────────────────────────────────────

function PageHeader({
  user, systemStatus, systemDotColor, metrics, onImport,
}: {
  user: any;
  systemStatus: string;
  systemDotColor: string;
  metrics: Metrics;
  onImport: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-white">
          Continuum
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-zinc-600">
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${systemDotColor}`} />
            <span className={systemStatus === 'Operational' ? 'text-zinc-500' : systemStatus === 'Analyzing' ? 'text-sky-500' : 'text-zinc-600'}>
              {systemStatus}
            </span>
          </span>
          {metrics.totalRepos > 0 && (
            <>
              <span className="text-zinc-800">·</span>
              <span>{metrics.totalRepos} {metrics.totalRepos === 1 ? 'repository' : 'repositories'}</span>
            </>
          )}
          {metrics.analyzedCount > 0 && (
            <>
              <span className="text-zinc-800">·</span>
              <span className="text-zinc-500">{metrics.analyzedCount} analyzed</span>
            </>
          )}
        </div>
      </div>

      <button
        onClick={onImport}
        className="flex shrink-0 items-center gap-1.5 rounded-[7px] bg-white px-3.5 py-2 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200"
      >
        <Plus size={12} />
        Import Repo
      </button>
    </div>
  );
}
