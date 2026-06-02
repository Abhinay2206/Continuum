'use client';

import { useState } from 'react';
import { ArrowRight, Bug, Code, GitBranch, Search, Sparkles, Terminal, Wand2 } from 'lucide-react';
import { StatusBadge } from '@/components/console/Premium';

const suggestions = [
  { icon: Wand2,    label: 'Explain architecture' },
  { icon: Bug,      label: 'Find memory leaks'    },
  { icon: Terminal, label: 'Generate unit tests'  },
];

const context = ['backend-core', 'auth-service', 'production telemetry'];
const tools   = ['Code edit', 'Test runner', 'PR author', 'Incident trace'];

export default function ChatPage() {
  const [input, setInput] = useState('');

  return (
    <div className="flex h-[calc(100dvh-56px-40px)] min-h-[600px] flex-col gap-4">

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between">
        <h1 className="text-[18px] font-semibold text-console-text">Command Line</h1>
        <StatusBadge tone="emerald" pulse>Connected</StatusBadge>
      </div>

      {/* Chat area */}
      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">

        <div className="flex min-h-0 flex-col overflow-hidden rounded-[7px] border border-console-border">
          {/* Messages */}
          <div className="flex-1 space-y-6 overflow-y-auto p-4">

            {/* AI message */}
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
                  Connected to your workspace. 4 repositories analyzed, production telemetry loaded. Ready to generate code changes with approval gates.
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {suggestions.map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      className="flex items-center gap-1.5 rounded-[5px] border border-console-border px-2.5 py-1 text-[11px] text-console-muted transition-colors hover:bg-console-bg-soft hover:text-console-text"
                    >
                      <Icon size={10} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* User message */}
            <div className="flex flex-row-reverse gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] border border-sky-300/20 bg-sky-300/[0.06] font-mono text-[10px] font-semibold text-console-sky">
                U
              </div>
              <div className="max-w-[76%] rounded-[6px] border border-console-border bg-console-bg-soft p-3 text-[12px] leading-relaxed text-console-text">
                Generate a new REST endpoint for user onboarding in the backend-core repository.
              </div>
            </div>

            {/* AI response */}
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] border border-violet-300/20 bg-violet-300/[0.06] font-mono text-[10px] font-semibold text-violet-300">
                AI
              </div>
              <div className="w-full max-w-3xl">
                <div className="mb-1.5 flex items-center gap-2 text-[11px]">
                  <span className="font-medium text-console-text">Continuum Engine</span>
                  <span className="text-console-faint">working…</span>
                </div>
                <div className="space-y-2.5 rounded-[6px] border border-console-border bg-console-bg-soft p-3">
                  <div className="flex items-center gap-2 text-[12px] text-console-muted">
                    <Search size={11} className="text-console-sky" />
                    Scanning <code className="rounded bg-console-bg-soft px-1.5 py-0.5 text-[11px] text-console-sky">backend-core/src/routes</code>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-console-muted">
                    <Code size={11} className="text-violet-400" />
                    Generating controller logic and validation middleware
                  </div>

                  <div className="overflow-hidden rounded-[5px] border border-console-border font-mono text-[11px]">
                    <div className="border-b border-console-border px-3 py-1.5 text-console-faint">src/routes/onboarding.ts</div>
                    <div className="p-3 text-console-muted">
                      <div>{"import { Router } from 'express';"}</div>
                      <div>{"import { validateUser } from '../middleware/validate';"}</div>
                      <div className="mt-1 text-console-faint">...</div>
                    </div>
                  </div>

                  <button className="flex items-center gap-1.5 rounded-[5px] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-black transition-colors hover:bg-zinc-200">
                    <GitBranch size={10} /> Open PR
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-console-border px-4 py-3">
            <div className="relative">
              <Sparkles size={12} className="absolute left-3 top-3 text-console-faint" />
              <input
                type="text"
                placeholder="Ask about your codebase or request changes…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="h-9 w-full rounded-[6px] border border-console-border bg-console-bg-soft pl-8 pr-10 text-[13px] text-console-text outline-none placeholder:text-console-faint transition-colors focus:border-console-border-strong"
              />
              <button className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-[4px] bg-white text-black transition-colors hover:bg-zinc-200">
                <ArrowRight size={10} />
              </button>
            </div>
            <div className="mt-1.5 flex gap-4 text-[10px] text-console-faint">
              <span>⌘K for commands</span>
              <span>@ to reference files</span>
              <span># to attach issues</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-3">
          <div className="rounded-[7px] border border-console-border p-3">
            <div className="mb-2 text-[12px] font-semibold text-console-muted">Context</div>
            <div className="space-y-1">
              {context.map((item) => (
                <div key={item} className="rounded-[5px] px-2.5 py-1.5 text-[12px] text-console-muted transition-colors hover:bg-console-bg-soft hover:text-console-text">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[7px] border border-console-border p-3">
            <div className="mb-2 text-[12px] font-semibold text-console-muted">Tools</div>
            <div className="space-y-1">
              {tools.map((tool) => (
                <div key={tool} className="flex items-center justify-between">
                  <span className="text-[12px] text-console-muted">{tool}</span>
                  <span className="text-[11px] text-console-emerald">on</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
