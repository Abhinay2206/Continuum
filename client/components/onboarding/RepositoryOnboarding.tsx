'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  GitBranch,
  FileCode2,
  Layers,
  Cpu,
  Database,
  NetworkIcon,
  Bot,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Bug,
  Network,
  BookOpen,
  Package,
  Code2,
  ExternalLink,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface StatusPayload {
  repoId: string;
  repoName: string;
  fullName: string;
  language: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  log: string;
  updatedAt: string;
  createdAt: string;
  frameworks: string[];
  dependencyCount: number;
}

interface ActivityEvent {
  id: number;
  time: string;
  message: string;
  type: 'info' | 'success' | 'agent';
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGES = [
  { id: 'connect',    label: 'Repository Connected',      icon: GitBranch,    logHint: null },
  { id: 'clone',      label: 'Cloning Repository',        icon: GitBranch,    logHint: 'Starting clone' },
  { id: 'parse',      label: 'Parsing Source Files',      icon: FileCode2,    logHint: 'Parsing files' },
  { id: 'chunk',      label: 'Analyzing Code Structure',  icon: Layers,       logHint: 'Chunking code' },
  { id: 'embed',      label: 'Generating Embeddings',     icon: Cpu,          logHint: 'Generating embeddings' },
  { id: 'store',      label: 'Building Knowledge Base',   icon: Database,     logHint: 'Storing in vector' },
  { id: 'arch',       label: 'Creating Architecture Map', icon: NetworkIcon,  logHint: '__sim_arch' },
  { id: 'agents',     label: 'Initializing AI Agents',    icon: Bot,          logHint: '__sim_agents' },
  { id: 'ready',      label: 'Repository Ready',          icon: Sparkles,     logHint: '__done' },
] as const;

type StageId = typeof STAGES[number]['id'];

const AGENTS = [
  { name: 'Bug Agent',          icon: Bug,          color: '#f59e0b', desc: 'Runtime error detection' },
  { name: 'Security Agent',     icon: ShieldCheck,  color: '#ef4444', desc: 'Vulnerability scanning' },
  { name: 'Architecture Agent', icon: Network,      color: '#8b5cf6', desc: 'Design pattern analysis' },
  { name: 'Docs Agent',         icon: BookOpen,     color: '#06b6d4', desc: 'Documentation generation' },
  { name: 'Review Agent',       icon: Code2,        color: '#10b981', desc: 'Code quality review' },
  { name: 'Dependency Agent',   icon: Package,      color: '#f97316', desc: 'Package analysis' },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveStageIndex(payload: StatusPayload): number {
  const { status, log } = payload;

  if (status === 'completed') return 8; // ready
  if (status === 'failed') return -1;
  if (status === 'pending') return 0;

  const lower = log.toLowerCase();
  if (lower.includes('storing in vector')) return 5;
  if (lower.includes('generating embeddings')) return 4;
  if (lower.includes('chunking code')) return 3;
  if (lower.includes('parsing files')) return 2;
  if (lower.includes('starting clone')) return 1;

  return 1; // running but no recognized log yet
}

function now() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

let _evId = 0;
function makeEvent(msg: string, type: ActivityEvent['type'] = 'info'): ActivityEvent {
  return { id: _evId++, time: now(), message: msg, type };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepRow({
  stage,
  state,
  isLast,
}: {
  stage: typeof STAGES[number];
  state: 'done' | 'active' | 'pending';
  isLast: boolean;
}) {
  const Icon = stage.icon;
  return (
    <div className="flex gap-3">
      {/* Track */}
      <div className="flex flex-col items-center">
        <div
          className={[
            'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-500',
            state === 'done'
              ? 'border-emerald-500/40 bg-emerald-500/10'
              : state === 'active'
              ? 'border-sky-400/60 bg-sky-500/10'
              : 'border-white/[0.06] bg-white/[0.02]',
          ].join(' ')}
        >
          {state === 'done' ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <CheckCircle2 size={13} className="text-emerald-400" />
            </motion.div>
          ) : state === 'active' ? (
            <>
              <Icon size={12} className="text-sky-300" />
              <span className="absolute inset-0 animate-ping rounded-full border border-sky-400/40" />
            </>
          ) : (
            <Icon size={12} className="text-zinc-600" />
          )}
        </div>
        {!isLast && (
          <div
            className={[
              'mt-1 w-px flex-1 transition-all duration-700',
              state === 'done' ? 'bg-emerald-500/30' : 'bg-white/[0.05]',
            ].join(' ')}
            style={{ minHeight: 24 }}
          />
        )}
      </div>

      {/* Label */}
      <div className="pb-6 pt-0.5">
        <p
          className={[
            'text-[13px] font-medium leading-none transition-colors duration-300',
            state === 'done'
              ? 'text-emerald-400'
              : state === 'active'
              ? 'text-white'
              : 'text-zinc-600',
          ].join(' ')}
        >
          {stage.label}
        </p>
        {state === 'active' && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-[11px] text-sky-400/70"
          >
            In progress…
          </motion.p>
        )}
        {state === 'done' && (
          <p className="mt-1 text-[11px] text-emerald-500/50">Complete</p>
        )}
      </div>
    </div>
  );
}

function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [events]);

  return (
    <div
      ref={ref}
      className="flex h-[200px] flex-col gap-2 overflow-y-auto pr-1"
      style={{ scrollbarWidth: 'none' }}
    >
      <AnimatePresence initial={false}>
        {events.map((ev) => (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, x: -8, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-3 rounded-[6px] bg-white/[0.02] px-3 py-2.5"
          >
            <span className="shrink-0 font-mono text-[10px] text-zinc-600 mt-0.5 min-w-[68px]">
              {ev.time}
            </span>
            <span
              className={[
                'text-[12px]',
                ev.type === 'success'
                  ? 'text-emerald-400'
                  : ev.type === 'agent'
                  ? 'text-sky-400'
                  : 'text-zinc-400',
              ].join(' ')}
            >
              {ev.message}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function StageVisualization({ stageIdx }: { stageIdx: number }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 800);
    return () => clearInterval(t);
  }, []);

  if (stageIdx <= 1) return <CloneViz tick={tick} />;
  if (stageIdx === 2) return <ParseViz tick={tick} />;
  if (stageIdx === 3) return <ChunkViz tick={tick} />;
  if (stageIdx === 4) return <EmbedViz tick={tick} />;
  if (stageIdx === 5) return <StoreViz tick={tick} />;
  return <DefaultViz />;
}

function CloneViz({ tick }: { tick: number }) {
  const lines = [
    "git clone https://github.com/org/repo.git",
    "Cloning into 'repo'...",
    "remote: Enumerating objects",
    "remote: Counting objects: 100%",
    "remote: Compressing objects: 100%",
    "Receiving objects: " + Math.min(100, tick * 8) + "%",
  ];
  return (
    <div className="rounded-[8px] border border-white/[0.06] bg-[#050508] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-2 font-mono text-[10px] text-zinc-600">continuum ~ engine</span>
      </div>
      <div className="space-y-1.5">
        {lines.slice(0, Math.min(lines.length, tick + 1)).map((l, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-[11px] text-emerald-400/80"
          >
            {i === 0 ? <span className="text-sky-400">$ </span> : null}
            {l}
            {i === lines.length - 1 && <span className="animate-pulse">█</span>}
          </motion.p>
        ))}
      </div>
    </div>
  );
}

function ParseViz({ tick }: { tick: number }) {
  const files = [
    { name: 'src/', type: 'dir' },
    { name: 'src/app.ts', type: 'ts' },
    { name: 'src/auth.service.ts', type: 'ts' },
    { name: 'src/database.service.ts', type: 'ts' },
    { name: 'src/api/routes.ts', type: 'ts' },
    { name: 'package.json', type: 'json' },
    { name: 'tsconfig.json', type: 'json' },
    { name: 'README.md', type: 'md' },
  ];
  const visible = files.slice(0, Math.min(files.length, tick + 1));
  return (
    <div className="rounded-[8px] border border-white/[0.06] bg-[#050508] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-500">Repository Tree</span>
        <span className="font-mono text-[10px] text-sky-400/70">{visible.length} files found</span>
      </div>
      <div className="space-y-1">
        {visible.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <FileCode2 size={10} className={f.type === 'dir' ? 'text-sky-500' : 'text-zinc-500'} />
            <span className="font-mono text-[11px] text-zinc-400">{f.name}</span>
            {f.type !== 'dir' && (
              <span className={[
                'ml-auto rounded px-1 py-px text-[9px] font-medium',
                f.type === 'ts' ? 'bg-sky-500/10 text-sky-400' :
                f.type === 'json' ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-500/10 text-zinc-400',
              ].join(' ')}>
                {f.type.toUpperCase()}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ChunkViz({ tick }: { tick: number }) {
  const chunks = Array.from({ length: 12 }, (_, i) => i);
  const filled = Math.min(12, tick + 1);
  return (
    <div className="rounded-[8px] border border-white/[0.06] bg-[#050508] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-500">Code Chunking</span>
        <span className="font-mono text-[10px] text-violet-400/70">{filled * 87} chunks</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {chunks.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: i < filled ? 1 : 0.12, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className={[
              'h-10 rounded-[4px] border text-[9px] font-mono flex items-center justify-center',
              i < filled
                ? 'border-violet-500/30 bg-violet-500/10 text-violet-400'
                : 'border-white/[0.04] bg-white/[0.02] text-zinc-700',
            ].join(' ')}
          >
            {i < filled ? `#${i + 1}` : '…'}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function EmbedViz({ tick }: { tick: number }) {
  const nodes = Array.from({ length: 16 }, (_, i) => ({
    x: 15 + (i % 4) * 22,
    y: 15 + Math.floor(i / 4) * 22,
  }));
  const progress = Math.min(100, tick * 7);
  return (
    <div className="rounded-[8px] border border-white/[0.06] bg-[#050508] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-500">Neural Embeddings</span>
        <span className="font-mono text-[10px] text-purple-400/70">{progress}%</span>
      </div>
      <svg viewBox="0 0 110 110" className="w-full" style={{ height: 110 }}>
        {nodes.map((n, i) =>
          nodes.slice(i + 1, i + 3).map((m, j) => (
            <line
              key={`${i}-${j}`}
              x1={n.x} y1={n.y} x2={m.x} y2={m.y}
              stroke={i < Math.floor(progress / 7) ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.04)'}
              strokeWidth="0.5"
            />
          ))
        )}
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.x} cy={n.y} r={i < Math.floor(progress / 7) ? 2.8 : 1.8}
            fill={i < Math.floor(progress / 7) ? '#8b5cf6' : '#27272a'}
            opacity={i < Math.floor(progress / 7) ? 0.9 : 0.3}
          >
            {i < Math.floor(progress / 7) && (
              <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2s" repeatCount="indefinite"
                begin={`${(i * 0.15).toFixed(2)}s`} />
            )}
          </circle>
        ))}
      </svg>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.05]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
    </div>
  );
}

function StoreViz({ tick }: { tick: number }) {
  const layers = ['Embeddings Layer', 'Metadata Index', 'Payload Index', 'Collection Created'];
  const done = Math.min(4, tick + 1);
  return (
    <div className="rounded-[8px] border border-white/[0.06] bg-[#050508] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-500">Vector Database</span>
        <span className="font-mono text-[10px] text-cyan-400/70">Qdrant</span>
      </div>
      <div className="space-y-2">
        {layers.map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: i < done ? 1 : 0.3 }}
            transition={{ delay: i * 0.2 }}
            className="flex items-center gap-2"
          >
            <div className={[
              'h-1.5 w-1.5 rounded-full',
              i < done ? 'bg-cyan-400' : 'bg-zinc-700',
            ].join(' ')} />
            <span className={[
              'text-[11px]',
              i < done ? 'text-zinc-300' : 'text-zinc-600',
            ].join(' ')}>
              {l}
            </span>
            {i < done && (
              <CheckCircle2 size={10} className="ml-auto text-emerald-400" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DefaultViz() {
  return (
    <div className="flex h-[140px] items-center justify-center rounded-[8px] border border-white/[0.06] bg-[#050508]">
      <div className="text-center">
        <Database size={24} className="mx-auto mb-2 text-zinc-700" />
        <p className="text-[11px] text-zinc-600">Processing…</p>
      </div>
    </div>
  );
}

function AgentCards({ activeCount }: { activeCount: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {AGENTS.map((agent, i) => {
        const Icon = agent.icon;
        const isOnline = i < activeCount;
        return (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12 }}
            className={[
              'rounded-[7px] border p-3 transition-all duration-500',
              isOnline
                ? 'border-white/[0.09] bg-white/[0.03]'
                : 'border-white/[0.04] bg-white/[0.01] opacity-40',
            ].join(' ')}
          >
            <div className="flex items-center justify-between">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-[5px]"
                style={{ background: `${agent.color}18` }}
              >
                <Icon size={13} style={{ color: agent.color }} />
              </div>
              <span
                className={[
                  'flex h-1.5 w-1.5 rounded-full',
                  isOnline ? 'bg-emerald-400' : 'bg-zinc-700',
                ].join(' ')}
              >
                {isOnline && <span className="animate-ping h-full w-full rounded-full bg-emerald-400 opacity-50" />}
              </span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-zinc-300">{agent.name}</p>
            <p className="text-[10px] text-zinc-600">{agent.desc}</p>
            <p className={['mt-1 text-[10px] font-medium', isOnline ? 'text-emerald-400' : 'text-zinc-700'].join(' ')}>
              {isOnline ? 'Online' : 'Standby'}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

function ReadyScreen({ repoName, repoId }: { repoName: string; repoId: string }) {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.push(`/console/repositories`);
    }, 4500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center py-8 text-center"
    >
      {/* Glow orb */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-2xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
          <CheckCircle2 size={36} className="text-emerald-400" />
        </div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-[22px] font-semibold text-white"
      >
        Repository Intelligence Ready
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-2 text-[13px] text-zinc-500"
      >
        {repoName} has been fully indexed and is ready for analysis
      </motion.p>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 grid w-full max-w-sm grid-cols-2 gap-3"
      >
        {[
          { label: 'Knowledge Base', value: 'Built', icon: Database, color: 'text-cyan-400' },
          { label: 'AI Agents', value: '6 Online', icon: Bot, color: 'text-violet-400' },
          { label: 'Architecture Map', value: 'Created', icon: Network, color: 'text-sky-400' },
          { label: 'Security Scan', value: 'Ready', icon: ShieldCheck, color: 'text-emerald-400' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-[7px] border border-white/[0.06] bg-white/[0.02] p-3">
              <Icon size={14} className={`mb-1.5 ${item.color}`} />
              <p className="text-[12px] font-semibold text-white">{item.value}</p>
              <p className="text-[10px] text-zinc-600">{item.label}</p>
            </div>
          );
        })}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 flex items-center gap-3"
      >
        <button
          onClick={() => router.push('/console/repositories')}
          className="flex items-center gap-2 rounded-[7px] bg-white px-5 py-2.5 text-[13px] font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          View Repository <ExternalLink size={12} />
        </button>
        <button
          onClick={() => router.push('/console/agents')}
          className="flex items-center gap-2 rounded-[7px] border border-white/[0.1] px-5 py-2.5 text-[13px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.05]"
        >
          Run Analysis
        </button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-5 text-[11px] text-zinc-700"
      >
        Redirecting to dashboard in a few seconds…
      </motion.p>
    </motion.div>
  );
}

function FailedScreen({ log }: { log: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10">
        <AlertTriangle size={28} className="text-rose-400" />
      </div>
      <h2 className="text-[18px] font-semibold text-white">Indexing Failed</h2>
      <p className="mt-2 text-[13px] text-zinc-500">
        An error occurred during repository analysis.
      </p>
      {log && (
        <pre className="mt-4 max-w-sm overflow-auto rounded-[6px] bg-rose-500/5 p-3 text-left font-mono text-[10px] text-rose-400/70 border border-rose-500/10">
          {log.slice(-300)}
        </pre>
      )}
      <button
        onClick={() => router.push('/console/repositories')}
        className="mt-6 rounded-[7px] bg-white px-5 py-2.5 text-[13px] font-semibold text-black hover:bg-zinc-200"
      >
        Back to Repositories
      </button>
    </div>
  );
}

// ── Global Status Bar ─────────────────────────────────────────────────────────

function GlobalStatusBar({
  stageIdx,
  stageLabel,
}: {
  stageIdx: number;
  stageLabel: string;
}) {
  const pct = Math.round((stageIdx / (STAGES.length - 1)) * 100);

  return (
    <div className="mb-6 rounded-[8px] border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-zinc-500">Repository Analysis</p>
          <p className="mt-0.5 text-[12px] text-zinc-300">{stageLabel}</p>
        </div>
        <span className="font-mono text-[18px] font-semibold text-white">{pct}%</span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.05]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-400"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ── Empty state skeleton ──────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[7px] border border-white/[0.04] bg-white/[0.01] p-3">
      <div className="mb-2 h-2.5 w-2/3 rounded bg-white/[0.05]" />
      <div className="h-2 w-1/2 rounded bg-white/[0.03]" />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  repoId: string;
  initialData: StatusPayload;
}

export function RepositoryOnboarding({ repoId, initialData }: Props) {
  const [data, setData] = useState<StatusPayload>(initialData);
  const [stageIdx, setStageIdx] = useState(() => deriveStageIndex(initialData));
  const [simStage, setSimStage] = useState<number>(stageIdx); // adds arch/agents sim
  const [agentCount, setAgentCount] = useState(0);
  const [activity, setActivity] = useState<ActivityEvent[]>([
    makeEvent(`Repository ${initialData.repoName} connected`, 'success'),
    makeEvent('Initializing Continuum Engine…'),
  ]);
  const prevStageRef = useRef(stageIdx);
  const completedRef = useRef(false);

  const addEvent = useCallback((msg: string, type: ActivityEvent['type'] = 'info') => {
    setActivity((prev) => [...prev.slice(-49), makeEvent(msg, type)]);
  }, []);

  // Poll status every 2 s
  useEffect(() => {
    if (completedRef.current) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/repositories/${repoId}/status`);
        if (!res.ok) return;
        const payload: StatusPayload = await res.json();
        setData(payload);
        const idx = deriveStageIndex(payload);
        setStageIdx(idx);
        if (payload.status === 'completed' || payload.status === 'failed') {
          completedRef.current = true;
        }
      } catch {}
    };

    poll();
    const t = setInterval(poll, 2000);
    return () => clearInterval(t);
  }, [repoId]);

  // React to stage changes — add activity events
  useEffect(() => {
    const prev = prevStageRef.current;
    prevStageRef.current = stageIdx;
    if (stageIdx <= prev) return;

    const messages: Record<number, string> = {
      1: 'Cloning repository from GitHub…',
      2: 'Traversing source tree, reading files…',
      3: 'Chunking code into semantic segments…',
      4: 'Generating vector embeddings (all-MiniLM-L6-v2)…',
      5: 'Persisting embeddings to Qdrant vector store…',
    };
    if (messages[stageIdx]) addEvent(messages[stageIdx]);

    // When backend completes, run simulated arch + agent stages
    if (stageIdx === 8) {
      addEvent('Indexing completed successfully', 'success');

      // sim: architecture map (stage 6)
      const t1 = setTimeout(() => {
        setSimStage(6);
        addEvent('Building architecture map from code graph…');
      }, 800);

      // sim: agent init (stage 7)
      const t2 = setTimeout(() => {
        setSimStage(7);
        addEvent('Initializing AI agent swarm…', 'agent');
        // bring agents online one by one
        for (let i = 1; i <= 6; i++) {
          setTimeout(() => {
            setAgentCount(i);
            addEvent(`${AGENTS[i - 1].name} is online`, 'agent');
          }, i * 400);
        }
      }, 2200);

      // sim: ready (stage 8 of simStage)
      const t3 = setTimeout(() => {
        setSimStage(8);
        addEvent('Repository Intelligence is ready ✓', 'success');
      }, 5500);

      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageIdx]);

  // The "effective" stage for the step list is simStage once backend completes
  const displayStage = stageIdx === 8 ? simStage : stageIdx;
  const currentStageLabel = STAGES[Math.min(displayStage, STAGES.length - 1)]?.label ?? '';
  const isFailed = data.status === 'failed';
  const isReady = displayStage >= 8 && !isFailed;

  return (
    <div className="mx-auto w-full max-w-[900px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
          Repository Intelligence
        </p>
        <h1 className="mt-1 text-[22px] font-semibold text-white">
          {data.repoName}
        </h1>
        <p className="mt-1 text-[13px] text-zinc-500">{data.fullName}</p>
      </motion.div>

      {/* Ready/Failed full-screen states */}
      <AnimatePresence mode="wait">
        {isReady && (
          <motion.div key="ready">
            <ReadyScreen repoName={data.repoName} repoId={repoId} />
          </motion.div>
        )}
        {isFailed && (
          <motion.div key="failed">
            <FailedScreen log={data.log} />
          </motion.div>
        )}
        {!isReady && !isFailed && (
          <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Global status bar */}
            <GlobalStatusBar stageIdx={displayStage} stageLabel={currentStageLabel} />

            <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
              {/* ── Left: Step list ── */}
              <div className="flex flex-col">
                {STAGES.map((s, i) => (
                  <StepRow
                    key={s.id}
                    stage={s}
                    state={
                      i < displayStage ? 'done' : i === displayStage ? 'active' : 'pending'
                    }
                    isLast={i === STAGES.length - 1}
                  />
                ))}
              </div>

              {/* ── Right: Dynamic panels ── */}
              <div className="space-y-4">
                {/* Stage visualization */}
                <motion.div
                  key={`viz-${displayStage}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="mb-2 text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
                    Live Preview
                  </p>
                  <StageVisualization stageIdx={displayStage} />
                </motion.div>

                {/* Agent cards — shown once agents stage starts */}
                <AnimatePresence>
                  {displayStage >= 7 && (
                    <motion.div
                      key="agents"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p className="mb-2 text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
                        AI Agents
                      </p>
                      {agentCount === 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                      ) : (
                        <AgentCards activeCount={agentCount} />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Activity feed */}
                <div>
                  <p className="mb-2 text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
                    Activity Feed
                  </p>
                  <ActivityFeed events={activity} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
