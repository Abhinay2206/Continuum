'use client';

import { useState, useEffect } from 'react';
import {
  Network, Database, ArrowRight, AlertTriangle, CheckCircle2,
  Loader2, RefreshCw, Layers, Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StatusBadge, ProgressBar } from '@/components/console/Premium';
import Link from 'next/link';

interface Finding {
  issue?: string;
  description?: string;
  recommendation?: string;
  severity?: string;
  affected_area?: string;
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
    architecture: Finding[];
    bugs: Finding[];
    security: Finding[];
  };
  action_plan: Array<{
    category: string;
    action: string;
    severity: string;
    file: string;
  }>;
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

const severityTone = (s?: string) =>
  s === 'critical' ? 'rose' as const :
  s === 'high'     ? 'amber' as const :
  s === 'medium'   ? 'sky' as const   : 'emerald' as const;

const couplingColor = (score: number) =>
  score >= 80 ? 'emerald' as const : score >= 60 ? 'sky' as const : 'amber' as const;

export function ArchitectureClient({ repos }: { repos: Repo[] }) {
  const [selectedId, setSelectedId] = useState<string>(repos[0]?.id ?? '');
  const selectedRepo = repos.find((r) => r.id === selectedId) ?? repos[0];
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

      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
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
          {selectedRepo && <ArchitecturePanel repo={selectedRepo} />}
        </div>
      </div>
    </div>
  );
}

function ArchitecturePanel({ repo }: { repo: Repo }) {
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

  const { scores, findings, action_plan, risk_level, topology } = agentResults;
  const archFindings = findings?.architecture ?? [];
  const archActions = (action_plan ?? []).filter((a) => a.category === 'architecture');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-[7px] border border-console-border px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-console-faint">{repo.fullName}</p>
            <h2 className="mt-1 text-[15px] font-semibold text-console-text">{repo.name}</h2>
          </div>
          <div className="flex flex-col items-end gap-2">
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

        {/* Score bars */}
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-console-border pt-4 sm:grid-cols-4">
          {[
            { label: 'Architecture', value: scores.architecture_score },
            { label: 'Overall',      value: scores.overall_score },
            { label: 'Security',     value: scores.security_score },
            { label: 'Code Quality', value: scores.code_quality_score },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="mb-1 flex justify-between text-[11px]">
                <span className="text-console-muted">{label}</span>
                <span className="tabular-nums text-console-faint">{value}</span>
              </div>
              <ProgressBar value={value} tone={couplingColor(value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Product Topology */}
      {topology && (topology.nodes?.length ?? 0) > 0 && (
        <TopologyDiagram topology={topology} />
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        {/* Findings */}
        <div className="rounded-[7px] border border-console-border p-3">
          <div className="mb-3 text-[12px] font-semibold text-console-muted">
            Architecture Findings
            <span className="ml-2 rounded-full bg-white/[0.06] px-2 py-px text-[10px] text-console-faint">
              {archFindings.length}
            </span>
          </div>
          {archFindings.length === 0 ? (
            <div className="flex items-center gap-2 text-[12px] text-console-faint">
              <CheckCircle2 size={13} className="text-emerald-400" />
              No architecture issues detected.
            </div>
          ) : (
            <div className="space-y-2">
              {archFindings.map((f, i) => (
                <div key={i} className="rounded-[5px] border border-console-border bg-white/[0.02] px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <StatusBadge tone={severityTone(f.severity)}>{f.severity ?? 'medium'}</StatusBadge>
                    <p className="text-[12px] font-medium text-console-text leading-snug">
                      {f.issue ?? f.description ?? 'Architecture issue'}
                    </p>
                  </div>
                  {f.affected_area && (
                    <p className="mt-1 font-mono text-[10px] text-console-faint">{f.affected_area}</p>
                  )}
                  {f.recommendation && (
                    <p className="mt-1.5 text-[11px] leading-relaxed text-console-muted">{f.recommendation}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action plan for architecture */}
        <div className="space-y-3">
          <div className="rounded-[7px] border border-console-border p-3">
            <div className="mb-2 text-[12px] font-semibold text-console-muted">Action Plan</div>
            {archActions.length === 0 ? (
              <div className="flex items-center gap-2 text-[12px] text-console-faint">
                <CheckCircle2 size={13} className="text-emerald-400" />
                No critical actions needed.
              </div>
            ) : (
              <div className="space-y-2">
                {archActions.slice(0, 6).map((item, i) => (
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

          <div className="rounded-[7px] border border-console-border p-3">
            <div className="mb-2 text-[12px] font-semibold text-console-muted">Breakdown</div>
            <div className="space-y-1.5">
              {[
                { label: 'Architecture', count: archFindings.length, color: 'bg-violet-400' },
                { label: 'Bugs',         count: findings.bugs?.length ?? 0,     color: 'bg-amber-400' },
                { label: 'Security',     count: findings.security?.length ?? 0, color: 'bg-rose-400' },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-2 text-[12px]">
                  <span className={`h-2 w-2 rounded-full ${color}`} />
                  <span className="flex-1 text-console-muted">{label}</span>
                  <span className="font-medium text-console-text">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Topology Diagram ────────────────────────────────────────────────────────

const NODE_TYPE_CONFIG: Record<TopologyNode['type'], { color: string; bg: string; border: string; label: string }> = {
  frontend:  { color: '#a78bfa', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)', label: 'Frontend' },
  gateway:   { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.35)', label: 'Gateway' },
  backend:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)', label: 'Backend' },
  service:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.35)', label: 'Service' },
  database:  { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.35)', label: 'Database' },
  cache:     { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.35)',  label: 'Cache' },
  queue:     { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.35)',  label: 'Queue' },
  external:  { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)', label: 'External' },
};

const COLUMN_ORDER: TopologyNode['type'][] = ['frontend', 'gateway', 'backend', 'service', 'database', 'cache', 'queue', 'external'];

const NODE_W = 120;
const NODE_H = 44;
const COL_GAP = 160;
const ROW_GAP = 64;
const PAD_X = 24;
const PAD_Y = 32;

interface NodePos { x: number; y: number; node: TopologyNode }

function computeLayout(topology: Topology): { positions: Map<string, NodePos>; svgWidth: number; svgHeight: number } {
  const columns: Map<TopologyNode['type'], TopologyNode[]> = new Map();
  for (const type of COLUMN_ORDER) columns.set(type, []);

  for (const node of topology.nodes) {
    const type = node.type in NODE_TYPE_CONFIG ? node.type : 'external';
    columns.get(type)!.push(node);
  }

  const activeCols = COLUMN_ORDER.filter((t) => (columns.get(t)?.length ?? 0) > 0);
  const maxRows = Math.max(...activeCols.map((t) => columns.get(t)!.length));

  const svgWidth = PAD_X * 2 + activeCols.length * NODE_W + (activeCols.length - 1) * (COL_GAP - NODE_W);
  const svgHeight = PAD_Y * 2 + maxRows * NODE_H + (maxRows - 1) * (ROW_GAP - NODE_H);

  const positions = new Map<string, NodePos>();
  activeCols.forEach((type, colIdx) => {
    const nodes = columns.get(type)!;
    const colX = PAD_X + colIdx * COL_GAP;
    const colHeight = nodes.length * NODE_H + (nodes.length - 1) * (ROW_GAP - NODE_H);
    const startY = PAD_Y + (svgHeight - PAD_Y * 2 - colHeight) / 2;
    nodes.forEach((node, rowIdx) => {
      positions.set(node.id, {
        x: colX,
        y: startY + rowIdx * ROW_GAP,
        node,
      });
    });
  });

  return { positions, svgWidth: Math.max(svgWidth, 300), svgHeight: Math.max(svgHeight, 120) };
}

function TopologyDiagram({ topology }: { topology: Topology }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const { positions, svgWidth, svgHeight } = computeLayout(topology);

  const nodeIds = new Set(topology.nodes.map((n) => n.id));
  const validEdges = topology.edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));

  return (
    <div className="rounded-[7px] border border-console-border p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[12px] font-semibold text-console-muted">Product Topology</div>
        <div className="flex items-center gap-3">
          {Array.from(new Set(topology.nodes.map((n) => n.type))).map((type) => {
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
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ display: 'block', minWidth: svgWidth }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="rgba(148,163,184,0.5)" />
            </marker>
          </defs>

          {/* Edges */}
          {validEdges.map((edge, i) => {
            const src = positions.get(edge.from)!;
            const dst = positions.get(edge.to)!;
            const x1 = src.x + NODE_W;
            const y1 = src.y + NODE_H / 2;
            const x2 = dst.x;
            const y2 = dst.y + NODE_H / 2;
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
                  <text
                    x={mx}
                    y={Math.min(y1, y2) - 4}
                    textAnchor="middle"
                    fill="rgba(148,163,184,0.55)"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {Array.from(positions.values()).map(({ x, y, node }) => {
            const cfg = NODE_TYPE_CONFIG[node.type] ?? NODE_TYPE_CONFIG.external;
            const isHov = hovered === node.id;
            return (
              <g
                key={node.id}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'default' }}
              >
                <rect
                  x={x}
                  y={y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={5}
                  fill={isHov ? cfg.bg.replace('0.12', '0.2').replace('0.08', '0.15') : cfg.bg}
                  stroke={isHov ? cfg.color : cfg.border}
                  strokeWidth={isHov ? 1.5 : 1}
                />
                <text
                  x={x + NODE_W / 2}
                  y={y + NODE_H / 2 - 5}
                  textAnchor="middle"
                  fill={cfg.color}
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                >
                  {node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label}
                </text>
                <text
                  x={x + NODE_W / 2}
                  y={y + NODE_H / 2 + 8}
                  textAnchor="middle"
                  fill="rgba(148,163,184,0.6)"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {cfg.label}
                </text>
                {/* Tooltip on hover */}
                {isHov && node.description && (
                  <foreignObject x={x - 20} y={y + NODE_H + 4} width={NODE_W + 40} height={48}>
                    <div
                      style={{
                        background: 'rgba(15,15,20,0.95)',
                        border: `1px solid ${cfg.border}`,
                        borderRadius: 5,
                        padding: '4px 8px',
                        fontSize: 10,
                        color: 'rgba(203,213,225,0.85)',
                        lineHeight: 1.4,
                      }}
                    >
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
