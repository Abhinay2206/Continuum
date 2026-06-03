'use client';

import { useState, useEffect } from 'react';
import {
  Network, Database, ArrowRight, AlertTriangle, CheckCircle2,
  Loader2, RefreshCw, Activity, ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StatusBadge, ProgressBar } from '@/components/console/Premium';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ArchFinding {
  issue?: string;
  title?: string;
  severity?: string;
  confidence?: number;
  description?: string;
  impact?: string;
  evidence?: string;
  recommendation?: string;
  affected_area?: string;
  current_pattern?: string;
  recommended_pattern?: string;
  effort?: string;
  file?: string;
}

interface TopologyNode {
  id: string;
  label: string;
  type: 'frontend' | 'backend' | 'gateway' | 'service' | 'database' | 'cache' | 'queue' | 'external';
  description?: string;
}

interface TopologyEdge {
  from: string;
  to: string;
  label?: string;
}

interface Topology {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

interface AgentResults {
  scores: {
    overall_score: number;
    architecture_score: number;
    security_score: number;
    bug_score: number;
    code_quality_score: number;
  };
  risk_level: string;
  summary: string;
  findings: {
    architecture: ArchFinding[];
    bugs: ArchFinding[];
    security: ArchFinding[];
  };
  action_plan: Array<{ category: string; action: string; severity: string; file: string }>;
  topology?: Topology;
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

const severityTone = (s?: string) =>
  s === 'critical' ? 'rose' as const :
  s === 'high'     ? 'amber' as const :
  s === 'medium'   ? 'sky' as const   : 'emerald' as const;

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

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

// ── Main Component ────────────────────────────────────────────────────────────

export function ArchitectureClient({ repos }: { repos: Repo[] }) {
  const [selectedId, setSelectedId] = useState<string>(repos[0]?.id ?? '');
  const selectedRepo = repos.find((r) => r.id === selectedId) ?? repos[0];
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
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

  // Reset finding selection when repo changes
  useEffect(() => { setSelectedIdx(0); }, [selectedId]);

  if (repos.length === 0) {
    return (
      <div className="pb-10">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-[18px] font-semibold text-console-text">Architecture</h1>
        </div>
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[7px] border border-console-border">
          <Network size={32} className="mb-3 text-zinc-600" />
          <p className="text-[14px] font-medium text-console-text">No repositories connected</p>
          <p className="mt-1 text-[12px] text-console-faint">Import a repository to see architecture analysis</p>
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
        <h1 className="text-[18px] font-semibold text-console-text">Architecture</h1>
        <button
          onClick={() => router.refresh()}
          className="flex items-center gap-1.5 rounded-[6px] border border-console-border px-3 py-1.5 text-[12px] font-medium text-console-text transition-colors hover:border-console-border-strong"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
        {/* Repo list */}
        <div>
          <div className="mb-2.5 text-[12px] text-console-muted">Repositories</div>
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
                    <div className="mt-0.5 text-[11px] text-console-faint">{repo.language ?? 'Unknown'}</div>
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

        {/* Detail */}
        <div>
          {selectedRepo && (
            <ArchitecturePanel
              repo={selectedRepo}
              selectedIdx={selectedIdx}
              setSelectedIdx={setSelectedIdx}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Architecture Panel ────────────────────────────────────────────────────────

function ArchitecturePanel({
  repo, selectedIdx, setSelectedIdx
}: {
  repo: Repo;
  selectedIdx: number;
  setSelectedIdx: (i: number) => void;
}) {
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
        {status === 'running' || status === 'pending' ? (
          <>
            <Loader2 size={28} className="mb-3 animate-spin text-sky-400" />
            <p className="text-[14px] font-medium text-console-text">Indexing in progress…</p>
            <p className="mt-1 text-[12px] text-console-faint">Architecture analysis starts once indexing completes.</p>
          </>
        ) : status === 'completed' ? (
          <>
            <Activity size={28} className="mb-3 animate-pulse text-sky-400" />
            <p className="text-[14px] font-medium text-console-text">Agent analysis running…</p>
            <p className="mt-1 text-[12px] text-console-faint">Architecture agents are analyzing {repo.name}.</p>
            <button
              onClick={handleReanalyze}
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
            <p className="text-[14px] font-medium text-console-text">Analysis not available</p>
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

  const { scores, findings, action_plan, risk_level, topology, summary } = agentResults;
  const archFindings = [...(findings?.architecture ?? [])].sort(
    (a, b) => (SEV_ORDER[a.severity ?? 'low'] ?? 3) - (SEV_ORDER[b.severity ?? 'low'] ?? 3)
  );
  const activeFind = archFindings[selectedIdx] ?? null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-[7px] border border-console-border px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-console-faint">{repo.fullName}</p>
            <h2 className="mt-1 text-[15px] font-semibold text-console-text">{repo.name}</h2>
            {summary && (
              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-console-muted">{summary}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusBadge tone={severityTone(risk_level)}>{risk_level} risk</StatusBadge>
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

        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-console-border pt-4 sm:grid-cols-4">
          {[
            { label: 'Architecture', value: scores.architecture_score },
            { label: 'Overall',      value: scores.overall_score },
            { label: 'Security',     value: scores.security_score },
            { label: 'Code Quality', value: scores.code_quality_score },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="mb-1.5 flex justify-between text-[11px]">
                <span className="text-console-muted">{label}</span>
                <span className={`tabular-nums font-semibold ${value >= 80 ? 'text-emerald-400' : value >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>{value}</span>
              </div>
              <ProgressBar value={value} tone={value >= 80 ? 'emerald' as const : value >= 60 ? 'sky' as const : 'amber' as const} />
            </div>
          ))}
        </div>
      </div>

      {/* Topology */}
      {topology && (topology.nodes?.length ?? 0) > 0 && (
        <TopologyDiagram topology={topology} />
      )}

      {/* Findings split view */}
      {archFindings.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-[7px] border border-console-border py-10 text-[12px] text-console-faint">
          <CheckCircle2 size={14} className="text-emerald-400" />
          No architecture issues detected
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
          {/* Finding list */}
          <div>
            <div className="mb-2 flex items-center justify-between text-[12px]">
              <span className="text-console-muted">Findings</span>
              <span className="text-console-violet">{archFindings.length} issues</span>
            </div>
            <div className="divide-y divide-console-border rounded-[7px] border border-console-border overflow-hidden">
              {archFindings.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  className={[
                    'flex w-full flex-col gap-1.5 px-3 py-2.5 text-left transition-colors hover:bg-console-bg-soft',
                    i === selectedIdx ? 'bg-console-bg-soft' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-1.5">
                    <StatusBadge tone={severityTone(f.severity)}>{f.severity ?? 'medium'}</StatusBadge>
                    <ConfidenceBadge value={f.confidence} />
                  </div>
                  <div className="line-clamp-2 text-[12px] font-medium leading-snug text-console-text">
                    {f.issue ?? f.title ?? 'Architecture issue'}
                  </div>
                  {f.affected_area && (
                    <div className="flex items-center gap-1 text-[10px] text-console-faint">
                      <ChevronRight size={9} />
                      <span className="truncate font-mono">{f.affected_area}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Finding detail */}
          {activeFind && <ArchFindingDetail finding={activeFind} />}
        </div>
      )}

      {/* Action plan */}
      {action_plan.length > 0 && (
        <div className="rounded-[7px] border border-console-border p-3">
          <div className="mb-3 text-[12px] font-semibold text-console-muted">Action Plan</div>
          <div className="space-y-2">
            {action_plan.filter(a => a.category === 'architecture').slice(0, 8).map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-[5px] bg-white/[0.02] px-3 py-2">
                <StatusBadge tone={severityTone(item.severity)}>{item.severity}</StatusBadge>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] leading-snug text-console-text">{item.action}</p>
                  {item.file && (
                    <p className="mt-0.5 truncate font-mono text-[10px] text-console-faint">{item.file}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Finding Detail ─────────────────────────────────────────────────────────────

function ArchFindingDetail({ finding }: { finding: ArchFinding }) {
  const impactBorder =
    finding.severity === 'critical' ? 'border-rose-400/30 bg-rose-400/[0.06]' :
    finding.severity === 'high'     ? 'border-amber-400/30 bg-amber-400/[0.06]' :
                                      'border-violet-400/30 bg-violet-400/[0.05]';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-[7px] border border-console-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge tone={severityTone(finding.severity)}>{finding.severity ?? 'medium'}</StatusBadge>
          <span className="inline-flex items-center rounded-[4px] border border-violet-400/25 bg-violet-400/10 px-1.5 py-px text-[9px] font-bold tracking-wide text-violet-400">
            ARCH
          </span>
          <ConfidenceBadge value={finding.confidence} />
          {finding.effort && <EffortBadge effort={finding.effort} />}
        </div>
        <h3 className="mt-2 text-[14px] font-semibold leading-snug text-console-text">
          {finding.issue ?? finding.title ?? 'Architecture Issue'}
        </h3>
        {finding.affected_area && (
          <p className="mt-0.5 font-mono text-[11px] text-console-faint">{finding.affected_area}</p>
        )}
      </div>

      {/* Impact */}
      {finding.impact && (
        <div className={`rounded-[7px] border px-4 py-3 ${impactBorder}`}>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-console-faint">Impact</div>
          <p className="text-[13px] leading-relaxed text-console-text">{finding.impact}</p>
        </div>
      )}

      {/* Description */}
      {finding.description && (
        <Section title="Description">
          <p className="text-[12px] leading-relaxed text-console-muted">{finding.description}</p>
        </Section>
      )}

      {/* Current vs Recommended */}
      {(finding.current_pattern || finding.recommended_pattern) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {finding.current_pattern && (
            <div className="overflow-hidden rounded-[6px] border border-rose-400/20">
              <div className="border-b border-rose-400/20 bg-rose-400/[0.04] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-rose-400/70">
                Current Pattern
              </div>
              <div className="px-3 py-3">
                <p className="text-[12px] leading-relaxed text-console-muted">{finding.current_pattern}</p>
              </div>
            </div>
          )}
          {finding.recommended_pattern && (
            <div className="overflow-hidden rounded-[6px] border border-emerald-400/20">
              <div className="border-b border-emerald-400/20 bg-emerald-400/[0.04] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-400/70">
                Recommended Pattern
              </div>
              <div className="px-3 py-3">
                <p className="text-[12px] leading-relaxed text-console-muted">{finding.recommended_pattern}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Evidence */}
      {finding.evidence && (
        <div className="overflow-hidden rounded-[6px] border border-console-border">
          <div className="border-b border-console-border bg-white/[0.02] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-console-faint">
            Evidence
          </div>
          <pre className="overflow-x-auto bg-black/20 px-4 py-3 font-mono text-[11px] leading-relaxed text-console-muted whitespace-pre-wrap">
            {finding.evidence}
          </pre>
        </div>
      )}

      {/* Recommendation */}
      {finding.recommendation && (
        <Section title="Recommendation">
          <p className="text-[12px] leading-relaxed text-console-text">{finding.recommendation}</p>
        </Section>
      )}
    </div>
  );
}

// ─── Topology Diagram ────────────────────────────────────────────────────────

const NODE_TYPE_CONFIG: Record<TopologyNode['type'], { color: string; bg: string; border: string; label: string }> = {
  frontend:  { color: '#a78bfa', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.35)',  label: 'Frontend'  },
  gateway:   { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.35)',  label: 'Gateway'   },
  backend:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.35)',  label: 'Backend'   },
  service:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.35)',  label: 'Service'   },
  database:  { color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.35)',  label: 'Database'  },
  cache:     { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.35)',  label: 'Cache'     },
  queue:     { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.35)',  label: 'Queue'     },
  external:  { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)', label: 'External'  },
};

const COLUMN_ORDER: TopologyNode['type'][] = ['frontend', 'gateway', 'backend', 'service', 'database', 'cache', 'queue', 'external'];

const NODE_W = 120, NODE_H = 44, COL_GAP = 160, ROW_GAP = 64, PAD_X = 24, PAD_Y = 32;

interface NodePos { x: number; y: number; node: TopologyNode }

function computeLayout(topology: Topology) {
  const columns: Map<TopologyNode['type'], TopologyNode[]> = new Map();
  for (const type of COLUMN_ORDER) columns.set(type, []);
  for (const node of topology.nodes) {
    const type = node.type in NODE_TYPE_CONFIG ? node.type : 'external';
    columns.get(type)!.push(node);
  }
  const activeCols = COLUMN_ORDER.filter(t => (columns.get(t)?.length ?? 0) > 0);
  const maxRows = Math.max(...activeCols.map(t => columns.get(t)!.length));
  const svgWidth = PAD_X * 2 + activeCols.length * NODE_W + (activeCols.length - 1) * (COL_GAP - NODE_W);
  const svgHeight = PAD_Y * 2 + maxRows * NODE_H + (maxRows - 1) * (ROW_GAP - NODE_H);
  const positions = new Map<string, NodePos>();
  activeCols.forEach((type, colIdx) => {
    const nodes = columns.get(type)!;
    const colX = PAD_X + colIdx * COL_GAP;
    const colHeight = nodes.length * NODE_H + (nodes.length - 1) * (ROW_GAP - NODE_H);
    const startY = PAD_Y + (svgHeight - PAD_Y * 2 - colHeight) / 2;
    nodes.forEach((node, rowIdx) => {
      positions.set(node.id, { x: colX, y: startY + rowIdx * ROW_GAP, node });
    });
  });
  return { positions, svgWidth: Math.max(svgWidth, 300), svgHeight: Math.max(svgHeight, 120) };
}

function TopologyDiagram({ topology }: { topology: Topology }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const { positions, svgWidth, svgHeight } = computeLayout(topology);
  const nodeIds = new Set(topology.nodes.map(n => n.id));
  const validEdges = topology.edges.filter(e => nodeIds.has(e.from) && nodeIds.has(e.to));

  return (
    <div className="rounded-[7px] border border-console-border p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[12px] font-semibold text-console-muted">Product Topology</div>
        <div className="flex flex-wrap items-center gap-3">
          {Array.from(new Set(topology.nodes.map(n => n.type))).map(type => {
            const cfg = NODE_TYPE_CONFIG[type] ?? NODE_TYPE_CONFIG.external;
            return (
              <div key={type} className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.color }} />
                <span className="text-[10px] text-console-faint">{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ display: 'block', minWidth: svgWidth }}>
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="rgba(148,163,184,0.5)" />
            </marker>
          </defs>

          {validEdges.map((edge, i) => {
            const src = positions.get(edge.from)!;
            const dst = positions.get(edge.to)!;
            const x1 = src.x + NODE_W, y1 = src.y + NODE_H / 2;
            const x2 = dst.x,         y2 = dst.y + NODE_H / 2;
            const mx = (x1 + x2) / 2;
            const isHighlighted = hovered === edge.from || hovered === edge.to;
            return (
              <g key={i}>
                <path
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={isHighlighted ? 'rgba(148,163,184,0.7)' : 'rgba(148,163,184,0.25)'}
                  strokeWidth={isHighlighted ? 1.5 : 1}
                  markerEnd="url(#arrowhead)"
                  strokeDasharray={isHighlighted ? 'none' : '4 3'}
                />
                {edge.label && (
                  <text x={mx} y={Math.min(y1, y2) - 4} textAnchor="middle" fill="rgba(148,163,184,0.55)" fontSize="9" fontFamily="monospace">
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {Array.from(positions.values()).map(({ x, y, node }) => {
            const cfg = NODE_TYPE_CONFIG[node.type] ?? NODE_TYPE_CONFIG.external;
            const isHov = hovered === node.id;
            return (
              <g key={node.id} onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'default' }}>
                <rect
                  x={x} y={y} width={NODE_W} height={NODE_H} rx={5}
                  fill={isHov ? cfg.bg.replace('0.12', '0.2').replace('0.08', '0.15') : cfg.bg}
                  stroke={isHov ? cfg.color : cfg.border}
                  strokeWidth={isHov ? 1.5 : 1}
                />
                <text x={x + NODE_W / 2} y={y + NODE_H / 2 - 5} textAnchor="middle" fill={cfg.color} fontSize="11" fontWeight="600" fontFamily="system-ui, sans-serif">
                  {node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label}
                </text>
                <text x={x + NODE_W / 2} y={y + NODE_H / 2 + 8} textAnchor="middle" fill="rgba(148,163,184,0.6)" fontSize="9" fontFamily="monospace">
                  {cfg.label}
                </text>
                {isHov && node.description && (
                  <foreignObject x={x - 20} y={y + NODE_H + 4} width={NODE_W + 40} height={48}>
                    <div style={{ background: 'rgba(15,15,20,0.95)', border: `1px solid ${cfg.border}`, borderRadius: 5, padding: '4px 8px', fontSize: 10, color: 'rgba(203,213,225,0.85)', lineHeight: 1.4 }}>
                      {node.description}
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
