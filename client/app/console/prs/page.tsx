'use client';

import { Check, FileDiff, GitMerge, MessageSquare, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/components/console/Premium';

const pullRequests = [
  { id: 'PR-1042', title: 'Refactor Auth Middleware', repo: 'backend-core', readiness: 98,  status: 'Ready'       },
  { id: 'PR-1043', title: 'Fix CSS Grid Layout',      repo: 'web-client',   readiness: 85,  status: 'Needs Review' },
  { id: 'PR-1044', title: 'Update Redis Types',       repo: 'backend-core', readiness: 100, status: 'Ready'       },
];

const mergeGates = [
  { label: 'No conflicts',             icon: ShieldCheck },
  { label: 'All checks passed',        icon: Check       },
  { label: 'Reviewer context loaded',  icon: MessageSquare },
];

const checklist = ['Types updated', 'Unit tests added', 'No performance regression', 'Auth fallback verified'];

const prStats = [
  { label: 'Readiness', value: '98%',    sub: 'All checks passed' },
  { label: 'Risk',      value: 'Low',    sub: 'No schema changes' },
  { label: 'Review',    value: '12 min', sub: 'AI summary ready'  },
];

export default function PRsPage() {
  return (
    <div className="pb-10">

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-console-text">Pull Requests</h1>
        <button className="flex items-center gap-1.5 rounded-[6px] bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200">
          <GitMerge size={12} />
          Merge Ready PRs
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">

        {/* PR list */}
        <div>
          {/* Tab row */}
          <div className="mb-2.5 flex items-center gap-1 border-b border-console-border pb-2.5">
            <button className="rounded-[5px] border border-console-border px-3 py-1 text-[12px] font-medium text-console-text">Open (3)</button>
            <button className="px-3 py-1 text-[12px] font-medium text-console-faint transition-colors hover:text-console-muted">Merged</button>
          </div>
          <div className="divide-y divide-console-border rounded-[7px] border border-console-border">
            {pullRequests.map((pr, index) => (
              <button
                key={pr.id}
                className={[
                  'flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-console-bg-soft',
                  index === 0 ? 'bg-console-bg-soft' : '',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-console-muted">{pr.id}</span>
                  <StatusBadge tone={pr.status === 'Ready' ? 'emerald' : 'amber'}>{pr.status}</StatusBadge>
                </div>
                <div className="text-[12px] font-medium text-console-text">{pr.title}</div>
                <div className="text-[11px] text-console-faint">{pr.repo}</div>
                <div className="mt-0.5 h-[2px] overflow-hidden rounded-full bg-console-border">
                  <div
                    className={`h-full rounded-full ${pr.readiness > 95 ? 'bg-console-emerald' : 'bg-console-amber'}`}
                    style={{ width: `${pr.readiness}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* PR detail */}
        <div className="space-y-4">

          {/* PR header */}
          <div className="rounded-[7px] border border-console-border px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge tone="emerald">No conflicts</StatusBadge>
                  <StatusBadge tone="emerald">Checks passed</StatusBadge>
                  <StatusBadge tone="violet">AI authored</StatusBadge>
                </div>
                <h2 className="mt-2 text-[15px] font-semibold text-console-text">Refactor Auth Middleware</h2>
                <p className="mt-0.5 text-[12px] text-console-faint">PR-1042 · backend-core · src/middleware/auth.ts</p>
              </div>
              <button className="shrink-0 flex items-center gap-1.5 rounded-[6px] bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200">
                <GitMerge size={12} /> Merge
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {prStats.map(({ label, value, sub }) => (
              <div key={label} className="rounded-[7px] border border-console-border px-4 py-3">
                <div className="text-[10px] uppercase tracking-wide text-console-faint">{label}</div>
                <div className="mt-1 text-[20px] font-semibold text-console-text">{value}</div>
                <div className="mt-0.5 text-[11px] text-console-faint">{sub}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">

            {/* Summary + diff */}
            <div className="space-y-3">
              <div className="rounded-[7px] border border-console-border p-3">
                <div className="mb-2 text-[12px] font-semibold text-console-muted">AI review summary</div>
                <p className="mb-3 text-[12px] leading-relaxed text-console-muted">
                  Extracted token validation into a typed utility. Improved reuse across services. Added strict JWT payload validation without changing request behavior.
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {checklist.map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-[11px] text-console-muted">
                      <Check size={11} className="text-console-emerald" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-[6px] border border-console-border font-mono text-[12px]">
                <div className="flex items-center gap-2 border-b border-console-border px-3 py-2 text-[11px] text-console-faint">
                  <FileDiff size={11} />
                  src/middleware/auth.ts
                </div>
                <div className="p-3">
                  <div className="bg-rose-300/[0.07] px-2 py-0.5 text-rose-300">{'- const token = req.headers.authorization;'}</div>
                  <div className="bg-emerald-300/[0.07] px-2 py-0.5 text-emerald-300">{"+ const token = extractBearerToken(req.headers.authorization);"}</div>
                  <div className="bg-emerald-300/[0.07] px-2 py-0.5 text-emerald-300">{"+ if (!token) throw new AuthError('Missing token');"}</div>
                </div>
              </div>
            </div>

            {/* Merge gates + provenance */}
            <div className="space-y-3">
              <div className="rounded-[7px] border border-console-border p-3">
                <div className="mb-2 text-[12px] font-semibold text-console-muted">Merge gates</div>
                <div className="space-y-1.5">
                  {mergeGates.map(({ label, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-2 text-[12px] text-console-muted">
                      <Icon size={12} className="text-console-emerald" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[7px] border border-console-border p-3">
                <div className="mb-2 text-[12px] font-semibold text-console-muted">Agent provenance</div>
                <div className="font-mono text-[11px] text-console-muted">agent-a9x</div>
                <div className="mt-1 text-[11px] text-console-faint">Auth specialist · reviewed against backend-core memory graph</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
