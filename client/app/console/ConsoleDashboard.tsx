'use client';

import { Bot, Code2, Cpu, Database, GitPullRequest, ShieldAlert, Terminal, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useUser } from '@/components/providers/UserProvider';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { ImportModal } from '@/components/dashboard/ImportModal';

export function ConsoleDashboard({
  repositories,
  metrics,
  recentActivity,
}: {
  repositories: any[];
  metrics: { totalRepos: number; health: number };
  recentActivity: any[];
}) {
  const { user, githubConnected } = useUser();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const isIndexing = repositories.some(repo => {
    const latestImport = repo.imports?.[0];
    return latestImport?.status === 'running' || latestImport?.status === 'pending';
  });

  const onboardingSteps = [
    { title: 'Account Created', completed: true },
    { title: 'GitHub Connected', completed: githubConnected },
    { title: 'First Repository Imported', completed: repositories.length > 0 },
    { title: 'Repository Indexed', completed: repositories.length > 0 && !isIndexing },
    { title: 'AI Agents Activated', completed: false }, // Placeholder for now
  ];

  if (repositories.length === 0) {
    return (
      <div className="pb-10">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white">Continuum</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                Waiting for setup
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col items-center justify-center rounded-[7px] border border-white/[0.07] bg-white/[0.02] p-10 text-center">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05] text-white">
              <Cpu size={24} />
            </div>
            <h2 className="text-xl font-semibold text-white">Welcome to Continuum, {user.name?.split(' ')[0] || 'Engineer'}</h2>
            <p className="mt-2 max-w-md text-[13px] text-zinc-400">
              Connect your first repository to begin AI analysis, bug detection, and architecture mapping.
            </p>
            <div className="mt-8 flex items-center gap-3">
              {!githubConnected ? (
                <button
                  onClick={() => signIn('github')}
                  className="flex items-center gap-2 rounded-[6px] bg-white px-4 py-2 text-[13px] font-semibold text-black transition-colors hover:bg-zinc-200"
                >
                  Connect GitHub <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-2 rounded-[6px] bg-white px-4 py-2 text-[13px] font-semibold text-black transition-colors hover:bg-zinc-200"
                >
                  Import Repository <ArrowRight size={14} />
                </button>
              )}
              <button className="flex items-center gap-2 rounded-[6px] border border-white/[0.1] bg-transparent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.05]">
                Learn How Continuum Works
              </button>
            </div>
          </div>

          <div className="rounded-[7px] border border-white/[0.07] bg-[#080808] p-5">
            <h3 className="mb-4 text-[13px] font-semibold text-zinc-300">Onboarding Progress</h3>
            <div className="space-y-4">
              {onboardingSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  {step.completed ? (
                    <CheckCircle2 size={16} className="mt-0.5 text-emerald-500" />
                  ) : (
                    <Circle size={16} className="mt-0.5 text-zinc-700" />
                  )}
                  <div>
                    <div className={`text-[13px] font-medium ${step.completed ? 'text-zinc-200' : 'text-zinc-500'}`}>
                      {step.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="pb-10">

      {/* ── Page header ───────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white">Continuum</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${repositories.length > 0 ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              {repositories.length > 0 ? 'System online' : 'Waiting for setup'}
            </span>
            <span className="text-zinc-700">·</span>
            <span>{metrics.totalRepos} repositories</span>
            <span className="text-zinc-700">·</span>
            <span>{metrics.health}% health</span>
          </div>
        </div>
      </div>

      {/* ── Key metrics ───────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { value: `${metrics.health}%`,  label: 'Engineering Health', trend: repositories.length > 0 ? 'Healthy' : 'N/A',   up: repositories.length > 0 ? true : null  },
          { value: '0',  label: 'Active Agents',       trend: 'Offline',   up: null  },
          { value: '0', label: 'Fixes Delivered',     trend: 'No activity',   up: null  },
          { value: '0',  label: 'Open Reviews',        trend: 'All clear',  up: null  },
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



          {/* Repositories */}
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-zinc-300">Repositories</h2>
              <button className="text-[11px] text-zinc-600 transition-colors hover:text-zinc-400">View all</button>
            </div>
            <div className="divide-y divide-white/[0.05] rounded-[7px] border border-white/[0.07]">
              {repositories.length === 0 ? (
                <div className="px-4 py-8 text-center text-[12px] text-zinc-500">
                  No repositories connected yet.
                </div>
              ) : (
                repositories.map((repo) => {
                  const latestImport = repo.imports?.[0];
                  const isIndexing = latestImport?.status === 'running' || latestImport?.status === 'pending';
                  const isFailed = latestImport?.status === 'failed';
                  const score = isIndexing ? 30 : isFailed ? 0 : 98;
                  
                  return (
                    <div key={repo.id} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.02]">
                      <Database size={12} className="shrink-0 text-zinc-600" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[13px] font-medium text-zinc-200">{repo.name}</span>
                        <span className="ml-2 text-[11px] text-zinc-600">{repo.language || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {isIndexing && <span className="text-[11px] text-amber-500">Indexing</span>}
                        {isFailed && <span className="text-[11px] text-rose-500">Failed</span>}
                        <div className="w-20">
                          <div className="h-[2px] overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className={`h-full rounded-full ${score >= 90 ? 'bg-emerald-500' : isFailed ? 'bg-rose-500' : 'bg-amber-500'}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-7 text-right text-[11px] tabular-nums text-zinc-500">{score}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Right — Activity */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-zinc-300">Activity</h2>
            <button className="text-[11px] text-zinc-600 transition-colors hover:text-zinc-400">View all</button>
          </div>
          {recentActivity.length === 0 ? (
            <div className="py-4 text-[12px] text-zinc-500">No recent activity.</div>
          ) : (
            recentActivity.map((event, index) => {
              const Icon = event.status === 'completed' ? GitPullRequest : event.status === 'failed' ? ShieldAlert : Code2;
              return (
                <div key={index} className="relative flex gap-3 py-2.5">
                  {index < recentActivity.length - 1 && (
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
                      <span className={event.status === 'completed' ? 'text-emerald-500' : event.status === 'running' || event.status === 'pending' ? 'text-sky-500' : 'text-amber-500'}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
