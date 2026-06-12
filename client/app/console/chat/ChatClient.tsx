'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ArrowRight, Bug, Code, FileCode, Search, Sparkles, Wand2, ChevronDown, AlertCircle } from 'lucide-react';
import { StatusBadge } from '@/components/console/Premium';

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL || 'http://localhost:8000';

interface Repo {
  id: string;
  name: string;
  fullName: string;
  language: string | null;
  status: string;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  sources?: string[];
  error?: boolean;
}

const SUGGESTIONS = [
  { icon: Wand2,   label: 'Explain the architecture' },
  { icon: Bug,     label: 'Where is authentication handled?' },
  { icon: Code,    label: 'How does the data layer work?' },
];

export function ChatClient({ repos }: { repos: Repo[] }) {
  const analyzable = repos.filter((r) => r.status === 'completed');
  const [selectedRepoId, setSelectedRepoId] = useState<string | undefined>(
    (analyzable[0] ?? repos[0])?.id
  );
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedRepo = repos.find((r) => r.id === selectedRepoId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || isThinking || !selectedRepoId) return;

    const userMsg: Message = { id: `${Date.now()}-u`, role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      const res = await fetch(`${ENGINE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId: selectedRepoId, question: q }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail ?? `Engine returned ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          role: 'ai',
          content: data.answer ?? 'No answer returned.',
          sources: Array.isArray(data.sources) ? data.sources : [],
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-e`,
          role: 'ai',
          content:
            err?.message === 'Failed to fetch'
              ? 'Could not reach the Continuum engine. Is it running on ' + ENGINE_URL + '?'
              : `Error: ${err?.message ?? 'unknown error'}`,
          error: true,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      send(input);
    }
  };

  const lastSources = [...messages].reverse().find((m) => m.role === 'ai' && m.sources?.length)?.sources ?? [];

  return (
    <div className="flex h-[calc(100dvh-56px-40px)] min-h-[600px] flex-col gap-4">

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between">
        <h1 className="text-[18px] font-semibold text-console-text">Command Line</h1>
        {selectedRepo ? (
          <StatusBadge tone="emerald" pulse>Connected</StatusBadge>
        ) : (
          <StatusBadge tone="amber">No repository</StatusBadge>
        )}
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">

        <div className="flex min-h-0 flex-col overflow-hidden rounded-[7px] border border-console-border">
          {/* Repo selector */}
          <div className="relative shrink-0 border-b border-console-border px-4 py-2.5">
            <button
              onClick={() => setShowRepoPicker((v) => !v)}
              disabled={repos.length === 0}
              className="flex items-center gap-2 rounded-[5px] border border-console-border bg-console-bg-soft px-2.5 py-1.5 text-[12px] text-console-text transition-colors hover:border-console-border-strong disabled:opacity-50"
            >
              <FileCode size={12} className="text-violet-300" />
              <span className="font-medium">{selectedRepo?.name ?? 'No repository'}</span>
              {selectedRepo && selectedRepo.status !== 'completed' && (
                <span className="text-[10px] text-console-amber">· {selectedRepo.status}</span>
              )}
              <ChevronDown size={11} className="text-console-faint" />
            </button>

            {showRepoPicker && repos.length > 0 && (
              <div className="absolute left-4 z-50 mt-1 max-h-64 w-72 overflow-y-auto rounded-[6px] border border-console-border bg-console-bg py-1 shadow-xl">
                {repos.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedRepoId(r.id); setShowRepoPicker(false); }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-[12px] text-console-muted transition-colors hover:bg-console-bg-soft hover:text-console-text"
                  >
                    <span className="truncate">{r.name}</span>
                    <span className={`ml-2 shrink-0 text-[10px] ${r.status === 'completed' ? 'text-console-emerald' : 'text-console-faint'}`}>
                      {r.status === 'completed' ? 'ready' : r.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-6 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] border border-violet-300/20 bg-violet-300/[0.06] font-mono text-[10px] font-semibold text-violet-300">
                  AI
                </div>
                <div className="max-w-2xl">
                  <div className="mb-1.5 flex items-center gap-2 text-[11px] text-console-muted">
                    <span className="font-medium text-console-text">Continuum Engine</span>
                    <StatusBadge tone="emerald">Ready</StatusBadge>
                  </div>
                  <div className="rounded-[6px] border border-console-border bg-console-bg-soft p-3 text-[12px] leading-relaxed text-console-muted">
                    {selectedRepo
                      ? <>Ask anything about <span className="text-console-text">{selectedRepo.name}</span>. I answer from the indexed codebase and cite the files I used.</>
                      : 'Import and analyze a repository to start asking questions about your code.'}
                  </div>
                  {selectedRepo && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {SUGGESTIONS.map(({ icon: Icon, label }) => (
                        <button
                          key={label}
                          onClick={() => send(label)}
                          className="flex items-center gap-1.5 rounded-[5px] border border-console-border px-2.5 py-1 text-[11px] text-console-muted transition-colors hover:bg-console-bg-soft hover:text-console-text"
                        >
                          <Icon size={10} />
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {messages.map((msg) =>
              msg.role === 'user' ? (
                <div key={msg.id} className="flex flex-row-reverse gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] border border-sky-300/20 bg-sky-300/[0.06] font-mono text-[10px] font-semibold text-console-sky">
                    U
                  </div>
                  <div className="max-w-[76%] whitespace-pre-wrap rounded-[6px] border border-console-border bg-console-bg-soft p-3 text-[12px] leading-relaxed text-console-text">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] border border-violet-300/20 bg-violet-300/[0.06] font-mono text-[10px] font-semibold text-violet-300">
                    AI
                  </div>
                  <div className="w-full max-w-3xl">
                    <div className="mb-1.5 flex items-center gap-2 text-[11px]">
                      <span className="font-medium text-console-text">Continuum Engine</span>
                    </div>
                    <div className={`whitespace-pre-wrap rounded-[6px] border p-3 text-[12px] leading-relaxed ${msg.error ? 'border-red-500/30 bg-red-500/[0.06] text-red-300' : 'border-console-border bg-console-bg-soft text-console-muted'}`}>
                      {msg.error && <AlertCircle size={12} className="mb-1 inline text-red-400" />} {msg.content}
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.sources.map((src) => (
                          <span key={src} className="flex items-center gap-1 rounded-[4px] border border-console-border bg-console-bg-soft px-2 py-0.5 font-mono text-[10px] text-console-sky">
                            <FileCode size={9} />{src}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {isThinking && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] border border-violet-300/20 bg-violet-300/[0.06] font-mono text-[10px] font-semibold text-violet-300">
                  AI
                </div>
                <div className="flex items-center gap-2 rounded-[6px] border border-console-border bg-console-bg-soft px-3 py-2.5 text-[12px] text-console-muted">
                  <Search size={11} className="animate-pulse text-console-sky" />
                  Searching the codebase…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-console-border px-4 py-3">
            <div className="relative">
              <Sparkles size={12} className="absolute left-3 top-3 text-console-faint" />
              <input
                type="text"
                placeholder={selectedRepo ? `Ask about ${selectedRepo.name}…` : 'Select a repository to begin…'}
                value={input}
                disabled={!selectedRepo || isThinking}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9 w-full rounded-[6px] border border-console-border bg-console-bg-soft pl-8 pr-10 text-[13px] text-console-text outline-none transition-colors placeholder:text-console-faint focus:border-console-border-strong disabled:opacity-50"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || isThinking || !selectedRepo}
                className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-[4px] bg-white text-black transition-colors hover:bg-zinc-200 disabled:opacity-40"
              >
                <ArrowRight size={10} />
              </button>
            </div>
            <div className="mt-1.5 flex gap-4 text-[10px] text-console-faint">
              <span>↵ to send</span>
              <span>Answers cite source files</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-3">
          <div className="rounded-[7px] border border-console-border p-3">
            <div className="mb-2 text-[12px] font-semibold text-console-muted">Active repository</div>
            {selectedRepo ? (
              <div className="space-y-1.5">
                <div className="rounded-[5px] bg-console-bg-soft px-2.5 py-1.5 text-[12px] text-console-text">{selectedRepo.fullName}</div>
                <div className="flex items-center justify-between px-1 text-[11px]">
                  <span className="text-console-muted">{selectedRepo.language ?? 'Unknown'}</span>
                  <span className={selectedRepo.status === 'completed' ? 'text-console-emerald' : 'text-console-amber'}>
                    {selectedRepo.status === 'completed' ? 'indexed' : selectedRepo.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[12px] text-console-faint">No repository selected</div>
            )}
          </div>

          <div className="min-h-0 flex-1 rounded-[7px] border border-console-border p-3">
            <div className="mb-2 text-[12px] font-semibold text-console-muted">Sources used</div>
            {lastSources.length > 0 ? (
              <div className="space-y-1">
                {lastSources.map((src) => (
                  <div key={src} className="truncate rounded-[5px] px-2.5 py-1.5 font-mono text-[11px] text-console-muted transition-colors hover:bg-console-bg-soft hover:text-console-text" title={src}>
                    {src}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[12px] text-console-faint">Files cited in answers appear here.</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
