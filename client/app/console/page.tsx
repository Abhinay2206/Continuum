'use client';

import { Bot, Code2, Cpu, Database, GitPullRequest, ShieldAlert, Terminal } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const throughputData = [
  { day: 'Mon', confidence: 82, throughput: 65 },
  { day: 'Tue', confidence: 86, throughput: 72 },
  { day: 'Wed', confidence: 88, throughput: 85 },
  { day: 'Thu', confidence: 87, throughput: 82 },
  { day: 'Fri', confidence: 94, throughput: 94 },
  { day: 'Sat', confidence: 92, throughput: 90 },
  { day: 'Sun', confidence: 96, throughput: 96 },
];

const approvals = [
  { task: 'Approve cache invalidation fix',     repo: 'backend-core',   risk: 'Low',    confidence: '97%', urgent: false },
  { task: 'Migrate auth middleware to edge',    repo: 'web-client',     risk: 'Medium', confidence: '88%', urgent: true  },
  { task: 'Generate billing regression suite',  repo: 'billing-service',risk: 'Low',    confidence: '91%', urgent: false },
];

const activity = [
  { icon: ShieldAlert,   title: 'Patched Redis connection leak',    repo: 'backend-core',  time: '2m ago',  status: 'Merged',  merged: true  },
  { icon: GitPullRequest,title: 'Merged App Router migration',      repo: 'web-client',    time: '14m ago', status: 'Merged',  merged: true  },
  { icon: Cpu,           title: 'Reduced reporting query cost',     repo: 'data-pipeline', time: '1h ago',  status: 'Active',  merged: false },
  { icon: Terminal,      title: 'Generated auth regression tests',  repo: 'auth-service',  time: '2h ago',  status: 'Review',  merged: false },
  { icon: Code2,         title: 'Fixed memory leak in worker pool', repo: 'backend-core',  time: '3h ago',  status: 'Merged',  merged: true  },
];

const repositories = [
  { name: 'backend-core',  lang: 'TypeScript', score: 98, indexing: false },
  { name: 'web-client',    lang: 'React',      score: 92, indexing: false },
  { name: 'data-pipeline', lang: 'Python',     score: 88, indexing: true  },
  { name: 'auth-service',  lang: 'Go',         score: 95, indexing: false },
];

export default function ConsolePage() {
  return (
    <div className="pb-10">

      {/* ── Page header ───────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white">Continuum</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              12 agents active
            </span>
            <span className="text-zinc-700">·</span>
            <span>38 repositories</span>
            <span className="text-zinc-700">·</span>
            <span>94% health</span>
          </div>
        </div>
        <span className="mt-1 text-[12px] text-zinc-600">3 pending approvals</span>
      </div>

      {/* ── Key metrics ───────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { value: '94',  label: 'Engineering Health', trend: '+2.4%',   up: true  },
          { value: '12',  label: 'Active Agents',       trend: 'live',   up: null  },
          { value: '148', label: 'Fixes Delivered',     trend: '+18%',   up: true  },
          { value: '45',  label: 'Open Reviews',        trend: '18 AI',  up: null  },
        ].map((m) => (
          <div key={m.label} className="rounded-[7px] border border-white/[0.07] px-4 py-3">
            <div className="text-[32px] font-semibold leading-none tracking-[-0.03em] text-white">
              {m.value}
            </div>
            <div className="mt-1.5 text-[12px] text-zinc-500">{m.label}</div>
            <div className={[
              'mt-0.5 text-[11px]',
              m.up === true ? 'text-emerald-400' : m.up === false ? 'text-rose-400' : 'text-zinc-600',
            ].join(' ')}>
              {m.trend}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main layout ───────────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">

        {/* Left */}
        <div className="space-y-5">

          {/* Approvals */}
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-zinc-300">Pending Approvals</h2>
              <span className="text-[11px] text-zinc-600">3 waiting</span>
            </div>
            <div className="divide-y divide-white/[0.05] rounded-[7px] border border-white/[0.07]">
              {approvals.map((item) => (
                <div
                  key={item.task}
                  className="flex items-center justify-between gap-4 px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-zinc-100">{item.task}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-zinc-600">
                      <span className="font-mono">{item.repo}</span>
                      <span>·</span>
                      <span className={item.urgent ? 'text-amber-400' : ''}>{item.risk} risk</span>
                      <span>·</span>
                      <span>{item.confidence} confidence</span>
                    </div>
                  </div>
                  <button className="shrink-0 rounded-[5px] border border-white/[0.10] px-2.5 py-1 text-[12px] font-medium text-zinc-300 transition-colors hover:border-white/[0.20] hover:text-white">
                    Approve
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Throughput chart */}
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-zinc-300">Agent Throughput</h2>
              <div className="flex items-center gap-3 text-[11px] text-zinc-600">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-px w-3 bg-emerald-500" />
                  Confidence
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-px w-3 bg-sky-500" />
                  Throughput
                </span>
              </div>
            </div>
            <div className="h-[150px] w-full rounded-[7px] border border-white/[0.07] px-3 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={throughputData} margin={{ top: 4, right: 0, left: -30, bottom: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#3f3f46', fontSize: 10 }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#3f3f46', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '5px', fontSize: '11px' }}
                    itemStyle={{ color: '#a1a1aa' }}
                    cursor={{ stroke: 'rgba(255,255,255,0.04)' }}
                  />
                  <Area type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={1.5} fillOpacity={0} fill="none" />
                  <Area type="monotone" dataKey="throughput" stroke="#0ea5e9" strokeWidth={1.5} fillOpacity={0} fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Repositories */}
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-zinc-300">Repositories</h2>
              <button className="text-[11px] text-zinc-600 transition-colors hover:text-zinc-400">View all</button>
            </div>
            <div className="divide-y divide-white/[0.05] rounded-[7px] border border-white/[0.07]">
              {repositories.map((repo) => (
                <div key={repo.name} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.02]">
                  <Database size={12} className="shrink-0 text-zinc-600" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[13px] font-medium text-zinc-200">{repo.name}</span>
                    <span className="ml-2 text-[11px] text-zinc-600">{repo.lang}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {repo.indexing && <span className="text-[11px] text-amber-500">Indexing</span>}
                    <div className="w-20">
                      <div className="h-[2px] overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className={`h-full rounded-full ${repo.score >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${repo.score}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-7 text-right text-[11px] tabular-nums text-zinc-500">{repo.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right — Activity */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-zinc-300">Activity</h2>
            <button className="text-[11px] text-zinc-600 transition-colors hover:text-zinc-400">View all</button>
          </div>
          {activity.map((event, index) => {
            const Icon = event.icon;
            return (
              <div key={index} className="relative flex gap-3 py-2.5">
                {index < activity.length - 1 && (
                  <div className="absolute left-[12px] top-[32px] h-[calc(100%-8px)] w-px bg-white/[0.06]" />
                )}
                <div className="z-10 flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-[#080808]">
                  <Icon size={10} strokeWidth={2} className="text-zinc-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium leading-snug text-zinc-300">{event.title}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-600">
                    <span className="font-mono">{event.repo}</span>
                    <span>·</span>
                    <span>{event.time}</span>
                    <span>·</span>
                    <span className={event.merged ? 'text-emerald-500' : event.status === 'Active' ? 'text-sky-500' : 'text-amber-500'}>
                      {event.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
