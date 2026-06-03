'use client';

import {
  Database,
  FolderTree,
  RefreshCw,
  Search,
  ShieldCheck,
  GitBranch as Github,
  Box,
  Server,
  Clock,
  ArrowRight,
  Loader2,
  Trash2,
  Sparkles,
  Bot,
  Network,
  Activity,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useUser } from '@/components/providers/UserProvider';
import Link from 'next/link';
import { ImportModal } from '@/components/dashboard/ImportModal';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export function RepositoriesClient({ repositories }: { repositories: any[] }) {
  const { githubConnected } = useUser();
  const [selectedRepoId, setSelectedRepoId] = useState<string | undefined>(repositories[0]?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  const handleSync = async (id: string) => {
    setIsSyncing(id);
    try {
      const res = await fetch(`/api/repositories/${id}/sync`, { method: 'POST' });
      if (res.ok) {
        router.push(`/console/repositories/${id}/onboarding`);
      } else {
        alert('Failed to start sync');
      }
    } catch {
      alert('Error starting sync');
    } finally {
      setIsSyncing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this repository?')) return;
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/repositories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
        if (selectedRepoId === id) setSelectedRepoId(undefined);
      } else {
        alert('Failed to delete repository');
      }
    } catch {
      alert('Error deleting repository');
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredRepos = repositories.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedRepo = repositories.find((r) => r.id === selectedRepoId) ?? repositories[0];

  // ── Empty state ────────────────────────────────────────────────────────────
  if (repositories.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex max-w-lg flex-col items-center text-center"
        >
          {/* Animated orb */}
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.03]">
              <Database size={36} className="text-zinc-500" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10">
                <Sparkles size={10} className="text-violet-400" />
              </span>
            </div>
          </div>

          <h2 className="text-[22px] font-semibold tracking-tight text-white">
            Connect your first repository
          </h2>
          <p className="mt-3 text-[13px] leading-relaxed text-zinc-500">
            Import a GitHub repository to activate your engineering intelligence layer - bug detection, security scanning, architecture analysis, and 6 specialized AI agents.
          </p>

          {/* Feature pills */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              { icon: Bot, label: 'AI Agents', color: 'text-violet-400' },
              { icon: ShieldCheck, label: 'Security Scan', color: 'text-emerald-400' },
              { icon: Network, label: 'Architecture Map', color: 'text-sky-400' },
              { icon: Activity, label: 'Live Analysis', color: 'text-amber-400' },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <span
                  key={f.label}
                  className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[11px] text-zinc-400"
                >
                  <Icon size={11} className={f.color} />
                  {f.label}
                </span>
              );
            })}
          </div>

          <div className="mt-8 flex items-center gap-3">
            {!githubConnected ? (
              <button
                onClick={() => signIn('github')}
                className="flex items-center gap-2 rounded-[7px] bg-white px-5 py-2.5 text-[13px] font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                <Github size={14} />
                Connect GitHub
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-2 rounded-[7px] bg-white px-5 py-2.5 text-[13px] font-semibold text-black transition-colors hover:bg-zinc-200"
                >
                  Import Repository
                  <ArrowRight size={13} />
                </button>
                <p className="text-[12px] text-zinc-600">GitHub connected ✓</p>
              </>
            )}
          </div>
        </motion.div>
        <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      </div>
    );
  }

  // ── Main view ──────────────────────────────────────────────────────────────
  return (
    <div className="pb-10">
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-console-text">Repositories</h1>
        {!githubConnected ? (
          <button
            onClick={() => signIn('github')}
            className="flex items-center gap-1.5 rounded-[6px] bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            <Github size={12} />
            Connect GitHub
          </button>
        ) : (
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-[6px] bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Import Repository
          </button>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        {/* Repo list */}
        <div>
          <div className="relative mb-2.5">
            <Search size={12} className="absolute left-2.5 top-2.5 text-console-faint" />
            <input
              type="text"
              placeholder="Search repositories…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-[6px] border border-console-border bg-console-bg-soft pl-7 pr-3 text-[12px] text-console-text outline-none placeholder:text-console-faint transition-colors focus:border-console-border-strong"
            />
          </div>
          <div className="divide-y divide-console-border rounded-[7px] border border-console-border">
            {filteredRepos.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12px] text-zinc-500">
                No repositories found.
              </div>
            ) : (
              filteredRepos.map((repo) => {
                const latestImport = repo.imports?.[0];
                const isIndexing =
                  latestImport?.status === 'running' || latestImport?.status === 'pending';
                const isFailed = latestImport?.status === 'failed';
                const isReady = latestImport?.status === 'completed';
                const active = repo.id === selectedRepo?.id;

                return (
                  <button
                    key={repo.id}
                    onClick={() => setSelectedRepoId(repo.id)}
                    className={[
                      'flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-console-bg-soft',
                      active ? 'bg-console-bg-soft' : '',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Database
                        size={13}
                        className={active ? 'text-console-muted shrink-0' : 'text-console-faint shrink-0'}
                      />
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-console-text truncate">
                          {repo.name}
                        </div>
                        <div className="mt-0.5 text-[11px] text-console-faint">
                          {repo.language || 'Unknown'} · {repo.frameworks?.length || 0} frameworks
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isIndexing ? (
                        <Link
                          href={`/console/repositories/${repo.id}/onboarding`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 rounded-[4px] border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-400 hover:bg-sky-500/20"
                        >
                          <RefreshCw size={9} className="animate-spin" />
                          Indexing
                        </Link>
                      ) : isFailed ? (
                        <span className="text-[11px] text-rose-500">Failed</span>
                      ) : isReady ? (
                        <ShieldCheck size={11} className="text-console-emerald" />
                      ) : (
                        <Clock size={11} className="text-zinc-600" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right detail */}
        <div className="space-y-4">
          {!selectedRepo ? (
            <div className="flex h-64 items-center justify-center rounded-[7px] border border-console-border bg-console-bg-soft text-[12px] text-zinc-500">
              Select a repository to view details.
            </div>
          ) : (
            <RepoDetail
              repo={selectedRepo}
              isSyncing={isSyncing}
              isDeleting={isDeleting}
              onSync={handleSync}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Repo Detail Panel ──────────────────────────────────────────────────────────

function RepoDetail({
  repo,
  isSyncing,
  isDeleting,
  onSync,
  onDelete,
}: {
  repo: any;
  isSyncing: string | null;
  isDeleting: string | null;
  onSync: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const latestImport = repo.imports?.[0];
  const isIndexing =
    latestImport?.status === 'running' || latestImport?.status === 'pending';

  return (
    <>
      {/* Indexing banner */}
      {isIndexing && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-[7px] border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3"
        >
          <div className="flex items-center gap-2.5">
            <RefreshCw size={13} className="animate-spin text-sky-400" />
            <div>
              <p className="text-[12px] font-medium text-sky-300">Repository is being indexed</p>
              <p className="text-[11px] text-sky-500/60">
                {latestImport?.log?.split('\n').filter(Boolean).pop() ?? 'Processing…'}
              </p>
            </div>
          </div>
          <Link
            href={`/console/repositories/${repo.id}/onboarding`}
            className="flex items-center gap-1.5 rounded-[6px] border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-[11px] font-medium text-sky-400 hover:bg-sky-500/20"
          >
            View Progress <ExternalLink size={10} />
          </Link>
        </motion.div>
      )}

      {/* Frameworks & Dependencies */}
      <div className="rounded-[7px] border border-console-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-console-text">{repo.name}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSync(repo.id)}
              disabled={isSyncing === repo.id || isDeleting === repo.id}
              className="flex items-center gap-1.5 rounded-[6px] bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-white/[0.08] disabled:opacity-50"
            >
              {isSyncing === repo.id ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <RefreshCw size={11} />
              )}{' '}
              Re-sync
            </button>
            <button
              onClick={() => onDelete(repo.id)}
              disabled={isDeleting === repo.id || isSyncing === repo.id}
              className="flex items-center gap-1.5 rounded-[6px] bg-rose-500/[0.1] px-2.5 py-1.5 text-[11px] font-medium text-rose-500 transition-colors hover:bg-rose-500/[0.2] disabled:opacity-50"
            >
              {isDeleting === repo.id ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Trash2 size={11} />
              )}{' '}
              Delete
            </button>
          </div>
        </div>

        {repo.frameworks?.length > 0 || repo.dependencies?.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {repo.frameworks?.map((f: any) => (
              <div
                key={f.id}
                className="rounded-[6px] border border-console-border px-3 py-2.5 transition-colors hover:bg-console-bg-soft"
              >
                <div className="flex items-center gap-1.5">
                  <Server size={11} className="text-console-faint" />
                  <span className="text-[12px] font-medium text-console-text">{f.name}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-console-faint">Framework</div>
              </div>
            ))}
            {repo.dependencies?.slice(0, 8).map((d: any) => (
              <div
                key={d.id}
                className="rounded-[6px] border border-console-border px-3 py-2.5 transition-colors hover:bg-console-bg-soft"
              >
                <div className="flex items-center gap-1.5">
                  <Box size={11} className="text-console-faint" />
                  <span className="text-[12px] font-medium text-console-text">{d.name}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-console-faint">
                  v{d.version || 'latest'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-[12px] text-zinc-500">
            {isIndexing
              ? 'Indexing in progress - frameworks will appear once analysis completes.'
              : 'No frameworks or dependencies detected yet.'}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[7px] border border-console-border p-4">
          <h2 className="mb-3 text-[13px] font-semibold text-console-text">Runtime & Identity</h2>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {repo.frameworks?.map((f: any) => (
              <span
                key={f.id}
                className="rounded-full border border-console-border px-2 py-0.5 text-[11px] text-console-muted"
              >
                {f.name}
              </span>
            ))}
          </div>
          <div className="mt-4 space-y-2.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-console-muted">Language</span>
              <span className="text-console-faint">{repo.language || 'Unknown'}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-console-muted">Visibility</span>
              <span className="text-console-faint">{repo.visibility}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-console-muted">Index Status</span>
              <span
                className={
                  isIndexing
                    ? 'text-sky-400'
                    : latestImport?.status === 'completed'
                    ? 'text-emerald-400'
                    : latestImport?.status === 'failed'
                    ? 'text-rose-400'
                    : 'text-zinc-600'
                }
              >
                {latestImport?.status ?? 'Not indexed'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[7px] border border-console-border p-4">
          <h2 className="mb-3 text-[13px] font-semibold text-console-text">Repository Metadata</h2>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2 text-[11px] text-console-muted">
              <span className="mt-px shrink-0 text-console-faint">·</span>
              <span>
                Default branch:{' '}
                <span className="font-mono">{repo.defaultBranch}</span>
              </span>
            </div>
            <div className="flex items-start gap-2 text-[11px] text-console-muted">
              <span className="mt-px shrink-0 text-console-faint">·</span>
              <span>
                URL:{' '}
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline"
                >
                  {repo.url}
                </a>
              </span>
            </div>
            <div className="flex items-start gap-2 text-[11px] text-console-muted">
              <span className="mt-px shrink-0 text-console-faint">·</span>
              <span>Imported: {new Date(repo.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
