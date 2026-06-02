'use client';

import { useState } from 'react';
import {
  ArrowRight, Bot, Check, Database, FileCode2,
  Play, RotateCw, SearchCode, X,
} from 'lucide-react';
import { StatusBadge, TimelineEvent } from '@/components/console/Premium';

const agents = [
  { id: 'CX4', task: 'Migrate to Next.js App Router',  status: 'Thinking',       progress: 72,  tone: 'sky'     as const, active: true  },
  { id: 'A9X', task: 'Fix memory leak in Redis queue',  status: 'Needs approval', progress: 94,  tone: 'amber'   as const, active: false },
  { id: 'B22', task: 'Generate auth regression tests',  status: 'Completed',      progress: 100, tone: 'emerald' as const, active: false },
];

const memoryScope = [
  { label: 'Files read',    value: '42'       },
  { label: 'Tokens loaded', value: '118k'     },
  { label: 'Risk score',    value: 'Low'      },
  { label: 'Test impact',   value: '14 suites'},
];

const toneClass: Record<string, string> = {
  sky:    'border-sky-300/20 text-console-sky',
  amber:  'border-amber-300/20 text-amber-300',
  emerald:'border-emerald-300/20 text-emerald-300',
};

export default function AgentsPage() {
  const [taskInput, setTaskInput] = useState('');

  return (
    <div className="pb-10">

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-console-text">AI Agents</h1>
        <button className="flex items-center gap-1.5 rounded-[6px] bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200">
          <Bot size={12} />
          Spawn Agent
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">

        {/* Agent fleet list */}
        <div>
          <div className="mb-2.5 flex items-center justify-between text-[12px]">
            <span className="text-console-muted">Fleet</span>
            <span className="text-console-emerald">12 online</span>
          </div>
          <div className="divide-y divide-console-border rounded-[7px] border border-console-border">
            {agents.map((agent) => (
              <button
                key={agent.id}
                className={[
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-console-bg-soft',
                  agent.active ? 'bg-console-bg-soft' : '',
                ].join(' ')}
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] border font-mono text-[10px] font-semibold ${toneClass[agent.tone]}`}>
                  {agent.id}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-medium text-console-text">{agent.task}</div>
                  <div className="mt-0.5 text-[11px] text-console-faint">{agent.status}</div>
                </div>
                {agent.status === 'Thinking' && (
                  <RotateCw size={11} className="shrink-0 animate-spin text-console-sky" />
                )}
                {agent.status === 'Needs approval' && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Agent detail panel */}
        <div className="overflow-hidden rounded-[7px] border border-console-border">

          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-console-border px-4 py-3">
            <div>
              <div className="text-[11px] font-mono text-console-muted">agent-cx4</div>
              <div className="mt-0.5 text-[14px] font-semibold text-console-text">
                Migrate to Next.js App Router
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge tone="sky" pulse>Thinking</StatusBadge>
              <button className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-console-border text-console-faint transition-colors hover:bg-console-border hover:text-console-text">
                <X size={13} />
              </button>
            </div>
          </div>

          <div className="grid gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_240px]">

            {/* Main */}
            <div className="space-y-4">
              {/* Memory loaded */}
              <div className="flex items-center gap-2 rounded-[6px] border border-console-border px-3 py-2 text-[12px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-console-text">Agent memory loaded</span>
                <span className="ml-auto text-console-faint">Updated 3m ago</span>
              </div>

              {/* Execution trace */}
              <div>
                <div className="mb-2 text-[12px] font-semibold text-console-muted">Execution trace</div>
                <TimelineEvent
                  icon={SearchCode}
                  tone="emerald"
                  title="Analyzed repository structure"
                  description="Read 42 files across pages, app, routing, and API boundary layers."
                  meta="complete"
                />
                <TimelineEvent
                  icon={RotateCw}
                  tone="sky"
                  title="Refactoring pages/index.tsx"
                  description="Converting client-only data flow into server-first route composition."
                  meta="active"
                />
                <TimelineEvent
                  icon={FileCode2}
                  tone="slate"
                  title="Update API routes"
                  description="Queued after component boundary validation."
                  meta="next"
                  last
                />
              </div>

              {/* Diff preview */}
              <div className="overflow-hidden rounded-[6px] border border-console-border font-mono text-[12px]">
                <div className="flex items-center justify-between border-b border-console-border px-3 py-2 text-[11px] text-console-faint">
                  <span>Diff preview</span>
                  <span className="text-console-emerald">confidence 93%</span>
                </div>
                <div className="p-3">
                  <div className="bg-rose-300/[0.07] px-2 py-0.5 text-rose-300">{"- import { useEffect, useState } from 'react';"}</div>
                  <div className="bg-rose-300/[0.07] px-2 py-0.5 text-rose-300">{"- export default function Home() {"}</div>
                  <div className="bg-emerald-300/[0.07] px-2 py-0.5 text-emerald-300">{"+ export default async function Home() {"}</div>
                  <div className="bg-emerald-300/[0.07] px-2 py-0.5 text-emerald-300">{"+ const data = await fetchConsoleData();"}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 rounded-[6px] bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200">
                  <Check size={12} /> Accept
                </button>
                <button className="flex items-center gap-1.5 rounded-[6px] border border-console-border px-3 py-1.5 text-[12px] font-medium text-console-text transition-colors hover:text-console-text">
                  <X size={12} /> Reject
                </button>
                <button className="flex items-center gap-1.5 rounded-[6px] border border-console-border px-3 py-1.5 text-[12px] font-medium text-console-text transition-colors hover:text-console-text">
                  <Play size={12} /> Run Tests
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-3">
              {/* Memory scope */}
              <div className="rounded-[6px] border border-console-border p-3">
                <div className="mb-2 text-[12px] font-semibold text-console-muted">Memory scope</div>
                <div className="space-y-1">
                  {memoryScope.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-[12px]">
                      <span className="text-console-muted">{label}</span>
                      <span className="font-medium text-console-text">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Repository context */}
              <div className="rounded-[6px] border border-console-border p-3">
                <div className="mb-2 text-[12px] font-semibold text-console-muted">Repository context</div>
                <div className="flex items-start gap-2 text-[12px] text-console-muted">
                  <Database size={12} className="mt-0.5 shrink-0 text-console-faint" />
                  <span>continuum-core, web-client — React / Next.js migrations</span>
                </div>
              </div>
            </aside>
          </div>

          {/* Agent input */}
          <div className="border-t border-console-border px-4 py-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Instruct the agent…"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                className="h-9 w-full rounded-[6px] border border-console-border bg-console-bg-soft pl-3 pr-10 text-[13px] text-console-text outline-none placeholder:text-console-faint transition-colors focus:border-console-border-strong"
              />
              <button className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-[4px] bg-white text-black transition-colors hover:bg-zinc-200">
                <ArrowRight size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
