'use client';

import { Database, FolderTree, RefreshCw, Search, ShieldCheck, GitBranch as Github, Box, Server, Clock, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useUser } from '@/components/providers/UserProvider';
import Link from 'next/link';
import { ImportModal } from '@/components/dashboard/ImportModal';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';

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
        router.refresh();
      } else {
        alert('Failed to start sync');
      }
    } catch (e) {
      alert('Error starting sync');
    } finally {
      setIsSyncing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this repository?')) {
      setIsDeleting(id);
      try {
        const res = await fetch(`/api/repositories/${id}`, { method: 'DELETE' });
        if (res.ok) {
          router.refresh();
          if (selectedRepoId === id) setSelectedRepoId(undefined);
        } else {
          alert('Failed to delete repository');
        }
      } catch (e) {
        alert('Error deleting repository');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const filteredRepos = repositories.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedRepo = repositories.find(r => r.id === selectedRepoId) || repositories[0];

  if (repositories.length === 0) {
    return (
      <div className="pb-10 flex min-h-[60vh] flex-col items-center justify-center">
        <div className="flex max-w-md flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03] text-zinc-400">
            <Database size={32} />
          </div>
          <h2 className="text-2xl font-semibold text-white">No repositories connected</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-zinc-400">
            Connect GitHub and import a repository to start code intelligence, bug detection, architecture analysis, and AI agents.
          </p>
          <div className="mt-8 flex items-center gap-4">
            {!githubConnected ? (
              <button
                onClick={() => signIn('github')}
                className="flex items-center gap-2 rounded-[6px] bg-white px-5 py-2.5 text-[14px] font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                <Github size={16} />
                Connect GitHub
              </button>
            ) : (
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 rounded-[6px] bg-white px-5 py-2.5 text-[14px] font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                Import Repository <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
        <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      </div>
    );
  }

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
                const isIndexing = latestImport?.status === 'running' || latestImport?.status === 'pending';
                const isFailed = latestImport?.status === 'failed';
                const score = isIndexing ? 30 : isFailed ? 0 : 98;
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
                    <div className="flex items-center gap-3">
                      <Database size={13} className={active ? 'text-console-muted' : 'text-console-faint'} />
                      <div>
                        <div className="text-[13px] font-medium text-console-text">{repo.name}</div>
                        <div className="mt-0.5 text-[11px] text-console-faint">
                          {repo.language || 'Unknown'} · {repo.frameworks?.length || 0} frameworks
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[12px] tabular-nums ${score >= 90 ? 'text-console-emerald' : isFailed ? 'text-rose-500' : 'text-console-amber'}`}>
                        {score}%
                      </span>
                      {isIndexing ? (
                        <RefreshCw size={11} className="animate-spin text-console-muted" />
                      ) : isFailed ? (
                        <ShieldCheck size={11} className="text-rose-500" />
                      ) : (
                        <ShieldCheck size={11} className="text-console-emerald" />
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
            <>
              {/* Domain map -> Now Frameworks & Dependencies */}
              <div className="rounded-[7px] border border-console-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[13px] font-semibold text-console-text">{selectedRepo.name}</h2>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleSync(selectedRepo.id)} 
                      disabled={isSyncing === selectedRepo.id || isDeleting === selectedRepo.id}
                      className="flex items-center gap-1.5 rounded-[6px] bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-white/[0.08] disabled:opacity-50"
                    >
                      {isSyncing === selectedRepo.id ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />} Re-sync
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedRepo.id)} 
                      disabled={isDeleting === selectedRepo.id || isSyncing === selectedRepo.id}
                      className="flex items-center gap-1.5 rounded-[6px] bg-rose-500/[0.1] px-2.5 py-1.5 text-[11px] font-medium text-rose-500 transition-colors hover:bg-rose-500/[0.2] disabled:opacity-50"
                    >
                      {isDeleting === selectedRepo.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />} Delete
                    </button>
                  </div>
                </div>
                
                {selectedRepo.frameworks?.length > 0 || selectedRepo.dependencies?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {selectedRepo.frameworks?.map((f: any) => (
                      <div key={f.id} className="rounded-[6px] border border-console-border px-3 py-2.5 transition-colors hover:bg-console-bg-soft">
                        <div className="flex items-center gap-1.5">
                          <Server size={11} className="text-console-faint" />
                          <span className="text-[12px] font-medium text-console-text">{f.name}</span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-console-faint">Framework</div>
                      </div>
                    ))}
                    {selectedRepo.dependencies?.slice(0, 8).map((d: any) => (
                      <div key={d.id} className="rounded-[6px] border border-console-border px-3 py-2.5 transition-colors hover:bg-console-bg-soft">
                        <div className="flex items-center gap-1.5">
                          <Box size={11} className="text-console-faint" />
                          <span className="text-[12px] font-medium text-console-text">{d.name}</span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-console-faint">v{d.version || 'latest'}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-[12px] text-zinc-500">
                    No frameworks or dependencies detected yet. (Is the worker running?)
                  </div>
                )}
              </div>

              {/* Ownership + Notes -> Now Repo Metadata */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[7px] border border-console-border p-4">
                  <h2 className="mb-3 text-[13px] font-semibold text-console-text">Runtime & Identity</h2>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {selectedRepo.frameworks?.map((f: any) => (
                      <span
                        key={f.id}
                        className="rounded-full border border-console-border px-2 py-0.5 text-[11px] text-console-muted"
                      >
                        {f.name}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-2.5 mt-4">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-console-muted">Language</span>
                      <span className="text-console-faint">{selectedRepo.language || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-console-muted">Visibility</span>
                      <span className="text-console-faint">{selectedRepo.visibility}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[7px] border border-console-border p-4">
                  <h2 className="mb-3 text-[13px] font-semibold text-console-text">Repository Metadata</h2>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2 text-[11px] text-console-muted">
                      <span className="mt-px shrink-0 text-console-faint">·</span>
                      <span>Default branch: <span className="font-mono">{selectedRepo.defaultBranch}</span></span>
                    </div>
                    <div className="flex items-start gap-2 text-[11px] text-console-muted">
                      <span className="mt-px shrink-0 text-console-faint">·</span>
                      <span>URL: <a href={selectedRepo.url} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">{selectedRepo.url}</a></span>
                    </div>
                    <div className="flex items-start gap-2 text-[11px] text-console-muted">
                      <span className="mt-px shrink-0 text-console-faint">·</span>
                      <span>Imported at: {new Date(selectedRepo.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
