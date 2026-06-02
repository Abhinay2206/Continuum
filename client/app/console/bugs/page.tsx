'use client';

import { useState } from 'react';
import { CheckCircle2, FileCode, GitPullRequest, ShieldAlert } from 'lucide-react';
import { StatusBadge, TimelineEvent } from '@/components/console/Premium';

const bugs = [
  { id: 1, title: 'Memory Leak in Redis Connection Pool', repo: 'backend-core',  severity: 'critical', progress: 96, time: '10m ago' },
  { id: 2, title: 'Race Condition in User Onboarding',    repo: 'auth-service',   severity: 'high',     progress: 64, time: '2h ago'  },
  { id: 3, title: 'Unnecessary Re-renders in Console',    repo: 'web-client',     severity: 'medium',   progress: 82, time: '5h ago'  },
];

const severityTone = (s: string) =>
  s === 'critical' ? 'rose' as const : s === 'high' ? 'amber' as const : 'sky' as const;

const analysisStats = [
  { label: 'Blast radius', value: 'Low',   sub: 'Singleton change only'        },
  { label: 'Rollback',     value: '< 2min',sub: 'No schema migration'          },
  { label: 'Confidence',   value: '97%',   sub: 'Tests and profile verified'   },
];

export default function BugsPage() {
  const [selectedBug, setSelectedBug] = useState(1);
  const activeBug = bugs.find((b) => b.id === selectedBug) ?? bugs[0];

  return (
    <div className="pb-10">

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-console-text">Bug Fixes</h1>
        <button className="flex items-center gap-1.5 rounded-[6px] bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200">
          <GitPullRequest size={12} />
          Generate PR
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">

        {/* Issue list */}
        <div>
          <div className="mb-2.5 flex items-center justify-between text-[12px]">
            <span className="text-console-muted">Open issues</span>
            <span className="text-console-rose">3 active</span>
          </div>
          <div className="divide-y divide-console-border rounded-[7px] border border-console-border">
            {bugs.map((bug) => (
              <button
                key={bug.id}
                onClick={() => setSelectedBug(bug.id)}
                className={[
                  'flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-console-bg-soft',
                  bug.id === selectedBug ? 'bg-console-bg-soft' : '',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge tone={severityTone(bug.severity)}>{bug.severity}</StatusBadge>
                  <span className="text-[11px] text-console-faint">{bug.time}</span>
                </div>
                <div className="text-[12px] font-medium text-console-text">{bug.title}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-console-faint">
                  <FileCode size={10} />
                  {bug.repo}
                </div>
                <div className="mt-0.5 h-[2px] overflow-hidden rounded-full bg-console-border">
                  <div
                    className={`h-full rounded-full ${bug.severity === 'critical' ? 'bg-console-rose' : bug.severity === 'high' ? 'bg-console-amber' : 'bg-console-sky'}`}
                    style={{ width: `${bug.progress}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bug detail */}
        <div className="space-y-4">

          {/* Bug header */}
          <div className="rounded-[7px] border border-console-border px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge tone={severityTone(activeBug.severity)}>{activeBug.severity}</StatusBadge>
                  <StatusBadge tone="emerald">fix ready</StatusBadge>
                  <StatusBadge tone="sky">97% confidence</StatusBadge>
                </div>
                <h2 className="mt-2 text-[15px] font-semibold text-console-text">{activeBug.title}</h2>
                <p className="mt-0.5 text-[12px] text-console-faint">{activeBug.repo} / src/db/redis.ts</p>
              </div>
              <button className="shrink-0 flex items-center gap-1.5 rounded-[6px] bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200">
                <GitPullRequest size={12} /> Create PR
              </button>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">

            {/* Root cause + diff */}
            <div className="space-y-3">
              <div className="rounded-[7px] border border-amber-300/20 bg-amber-300/[0.04] px-4 py-3 text-[12px] leading-relaxed text-console-muted">
                Redis connection pool creates a new client per request without releasing. Under load this exhausts connections until the worker restarts.
              </div>

              <div className="overflow-hidden rounded-[6px] border border-console-border font-mono text-[12px]">
                <div className="flex items-center justify-between border-b border-console-border px-3 py-2 text-[11px] text-console-faint">
                  <span>src/db/redis.ts</span>
                  <span className="text-console-emerald">Auto-fix ready</span>
                </div>
                <div className="p-3">
                  <div className="text-console-faint">{'@@ -15,7 +15,11 @@'}</div>
                  <div className="text-console-muted px-1">{'  export const getRedisClient = async () => {'}</div>
                  <div className="bg-rose-300/[0.07] px-2 py-0.5 text-rose-300">{'- const client = createClient();'}</div>
                  <div className="bg-rose-300/[0.07] px-2 py-0.5 text-rose-300">{'- await client.connect();'}</div>
                  <div className="bg-rose-300/[0.07] px-2 py-0.5 text-rose-300">{'- return client;'}</div>
                  <div className="bg-emerald-300/[0.07] px-2 py-0.5 text-emerald-300">{'+ if (!global.redisClient) {'}</div>
                  <div className="bg-emerald-300/[0.07] px-2 py-0.5 text-emerald-300">{'+ global.redisClient = createClient();'}</div>
                  <div className="bg-emerald-300/[0.07] px-2 py-0.5 text-emerald-300">{'+ await global.redisClient.connect();'}</div>
                  <div className="bg-emerald-300/[0.07] px-2 py-0.5 text-emerald-300">{'+ }'}</div>
                  <div className="bg-emerald-300/[0.07] px-2 py-0.5 text-emerald-300">{'+ return global.redisClient;'}</div>
                </div>
              </div>
            </div>

            {/* Tests + stats */}
            <div className="space-y-3">
              <div className="rounded-[7px] border border-console-border p-3">
                <div className="mb-2 text-[12px] font-semibold text-console-muted">Test results</div>
                <TimelineEvent icon={CheckCircle2} tone="emerald" title="Unit tests passed" description="45/45 tests passed." meta="now" />
                <TimelineEvent icon={CheckCircle2} tone="emerald" title="Integration suite" description="12 Redis tests verified." meta="now" />
                <TimelineEvent icon={ShieldAlert}  tone="sky"     title="Memory profile clear" description="No connection growth detected." meta="now" last />
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-[7px] border border-console-border p-3">
                {analysisStats.map(({ label, value, sub }) => (
                  <div key={label}>
                    <div className="text-[10px] uppercase tracking-wide text-console-faint">{label}</div>
                    <div className="mt-1 text-[15px] font-semibold text-console-text">{value}</div>
                    <div className="mt-0.5 text-[10px] text-console-faint">{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
