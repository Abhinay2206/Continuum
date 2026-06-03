'use client';

import { useState, useEffect } from 'react';
import { GitBranch as Github, Loader2, X, Search, CheckCircle2 } from 'lucide-react';
import { useUser } from '@/components/providers/UserProvider';
import { useRouter } from 'next/navigation';

export function ImportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const { workspace } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/github/repositories')
        .then((res) => res.json())
        .then((data) => {
          if (data.repositories) {
            setRepos(data.repositories);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredRepos = repos.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  const handleImport = async (repo: any) => {
    try {
      setImportingId(repo.githubId);
      const res = await fetch('/api/repositories/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace.id,
          repository: repo,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onClose();
        router.push(`/console/repositories/${data.repository.id}/onboarding`);
      } else {
        const error = await res.json();
        alert('Failed to import: ' + error.message);
      }
    } catch (e: any) {
      alert('Error importing repository');
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[12px] border border-white/[0.1] bg-[#0A0A0A] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Github size={18} className="text-white" />
            <h2 className="text-[15px] font-semibold text-white">Import from GitHub</h2>
          </div>
          <button 
            onClick={onClose}
            className="rounded-[6px] p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-white/[0.08] p-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search your repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-[6px] border border-white/[0.08] bg-white/[0.02] pl-9 pr-4 text-[13px] text-white outline-none placeholder:text-zinc-600 focus:border-white/[0.15] focus:bg-white/[0.04]"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center text-zinc-500">
              <Loader2 size={24} className="animate-spin mb-3" />
              <div className="text-[13px]">Fetching repositories...</div>
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[13px] text-zinc-500">
              No repositories found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1">
              {filteredRepos.map((repo) => (
                <div 
                  key={repo.githubId} 
                  className="flex items-center justify-between rounded-[8px] border border-transparent px-3 py-3 transition-colors hover:bg-white/[0.03]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-[14px] font-medium text-white">{repo.name}</div>
                      <span className="rounded-full border border-white/[0.1] bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-400">
                        {repo.visibility}
                      </span>
                    </div>
                    <div className="mt-1 text-[12px] text-zinc-500 truncate max-w-md">
                      {repo.fullName} · {repo.language || 'Unknown'} · Updated {new Date(repo.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleImport(repo)}
                    disabled={importingId === repo.githubId}
                    className="flex w-24 shrink-0 items-center justify-center gap-1.5 rounded-[6px] bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-70 disabled:hover:bg-white"
                  >
                    {importingId === repo.githubId ? (
                      <><Loader2 size={12} className="animate-spin" /> Importing</>
                    ) : (
                      'Import'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
