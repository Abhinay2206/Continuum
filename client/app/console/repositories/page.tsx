'use client';

import { Database, FolderTree, RefreshCw, Search, ShieldCheck, GitBranch as Github } from 'lucide-react';

const repositories = [
  { name: 'continuum-core', lang: 'TypeScript', status: 'Mapped',   health: 98, domains: 43, active: true  },
  { name: 'auth-service',   lang: 'Rust',       status: 'Scanning', health: 85, domains: 18, active: false },
  { name: 'web-client',     lang: 'React',      status: 'Mapped',   health: 92, domains: 27, active: false },
  { name: 'data-pipeline',  lang: 'Python',     status: 'Mapped',   health: 88, domains: 16, active: false },
];

const domains = [
  { name: 'API Gateway',     files: 12,  complexity: 'Low'      },
  { name: 'Auth Domain',     files: 45,  complexity: 'High'     },
  { name: 'Database Models', files: 89,  complexity: 'Medium'   },
  { name: 'Queue Workers',   files: 23,  complexity: 'Low'      },
  { name: 'Agent Engine',    files: 156, complexity: 'Very High'},
];

const techStack = ['TypeScript', 'Node.js', 'Express', 'Prisma', 'PostgreSQL', 'Redis', 'Docker'];

const owners = [
  { name: 'alice@continuum.ai', pct: 45 },
  { name: 'bob@continuum.ai',   pct: 30 },
  { name: 'AI Auto-fix',        pct: 25 },
];

const notes = [
  'Cyclic dependency in src/engine/tasks.ts',
  'Pagination guards needed in src/models/user.ts',
  'Agent Engine extraction → 40% reduction in deploy risk',
];

export default function RepositoriesPage() {
  return (
    <div className="pb-10">

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-console-text">Repositories</h1>
        <button className="flex items-center gap-1.5 rounded-[6px] bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200">
          <Github size={12} />
          Connect GitHub
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">

        {/* Repo list */}
        <div>
          <div className="relative mb-2.5">
            <Search size={12} className="absolute left-2.5 top-2.5 text-console-faint" />
            <input
              type="text"
              placeholder="Search repositories…"
              className="h-8 w-full rounded-[6px] border border-console-border bg-console-bg-soft pl-7 pr-3 text-[12px] text-console-text outline-none placeholder:text-console-faint transition-colors focus:border-console-border-strong"
            />
          </div>
          <div className="divide-y divide-console-border rounded-[7px] border border-console-border">
            {repositories.map((repo) => (
              <button
                key={repo.name}
                className={[
                  'flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-console-bg-soft',
                  repo.active ? 'bg-console-bg-soft' : '',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  <Database size={13} className={repo.active ? 'text-console-muted' : 'text-console-faint'} />
                  <div>
                    <div className="text-[13px] font-medium text-console-text">{repo.name}</div>
                    <div className="mt-0.5 text-[11px] text-console-faint">{repo.lang} · {repo.domains} domains</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[12px] tabular-nums ${repo.health >= 90 ? 'text-console-emerald' : 'text-console-amber'}`}>
                    {repo.health}%
                  </span>
                  {repo.status === 'Scanning'
                    ? <RefreshCw size={11} className="animate-spin text-console-muted" />
                    : <ShieldCheck size={11} className="text-console-emerald" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right detail */}
        <div className="space-y-4">

          {/* Domain map */}
          <div className="rounded-[7px] border border-console-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-console-text">continuum-core</h2>
              <span className="text-[11px] text-console-emerald">Analysis complete</span>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {domains.map((node) => (
                <div key={node.name} className="rounded-[6px] border border-console-border px-3 py-2.5 transition-colors hover:bg-console-bg-soft">
                  <div className="flex items-center gap-1.5">
                    <FolderTree size={11} className="text-console-faint" />
                    <span className="text-[12px] font-medium text-console-text">{node.name}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-console-faint">{node.files} files · {node.complexity}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ownership + Notes */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[7px] border border-console-border p-4">
              <h2 className="mb-3 text-[13px] font-semibold text-console-text">Runtime & Ownership</h2>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-console-border px-2 py-0.5 text-[11px] text-console-muted"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <div className="space-y-2.5">
                {owners.map(({ name, pct }) => (
                  <div key={name}>
                    <div className="mb-1 flex justify-between text-[11px]">
                      <span className="text-console-muted">{name}</span>
                      <span className="text-console-faint">{pct}%</span>
                    </div>
                    <div className="h-[2px] overflow-hidden rounded-full bg-console-border">
                      <div className="h-full rounded-full bg-console-sky/60" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[7px] border border-console-border p-4">
              <h2 className="mb-3 text-[13px] font-semibold text-console-text">Architecture Notes</h2>
              <p className="mb-3 text-[12px] leading-relaxed text-console-muted">
                Domain-driven monolith. Highest coupling: Auth ↔ Agent Engine.
              </p>
              <div className="space-y-1.5">
                {notes.map((note) => (
                  <div key={note} className="flex items-start gap-2 text-[11px] text-console-muted">
                    <span className="mt-px shrink-0 text-console-faint">·</span>
                    <span>{note}</span>
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
