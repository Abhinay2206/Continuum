'use client';

import { Cpu, GitBranch as Github, Key, Lock, Save, Settings, Shield, Users } from 'lucide-react';

const navItems = [
  { id: 'general',      label: 'General',     icon: Settings, active: true  },
  { id: 'team',         label: 'Team',        icon: Users,    active: false },
  { id: 'integrations', label: 'Integrations',icon: Github,   active: false },
  { id: 'models',       label: 'AI Models',   icon: Cpu,      active: false },
  { id: 'keys',         label: 'API Keys',    icon: Key,      active: false },
  { id: 'security',     label: 'Security',    icon: Shield,   active: false },
];

export default function SettingsPage() {
  return (
    <div className="max-w-4xl pb-10">

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-console-text">Settings</h1>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[200px_minmax(0,1fr)]">

        {/* Nav */}
        <div className="rounded-[7px] border border-console-border p-1.5">
          {navItems.map((nav) => (
            <button
              key={nav.id}
              className={[
                'flex w-full items-center gap-2.5 rounded-[5px] px-3 py-2 text-[13px] font-medium transition-colors',
                nav.active
                  ? 'bg-console-bg-panel text-console-text'
                  : 'text-console-muted hover:bg-console-bg-soft hover:text-console-text',
              ].join(' ')}
            >
              <nav.icon size={13} className={nav.active ? 'text-console-text' : 'text-console-faint'} />
              {nav.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">

          {/* Workspace profile */}
          <div className="rounded-[7px] border border-console-border p-4">
            <h2 className="mb-3 text-[13px] font-semibold text-console-text">Workspace Profile</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-console-muted">Workspace Name</label>
                <input
                  type="text"
                  defaultValue="Acme Corp"
                  className="h-8 w-full max-w-sm rounded-[6px] border border-console-border bg-console-bg-soft px-3 text-[13px] text-console-text outline-none transition-colors placeholder:text-console-faint focus:border-console-border-strong"
                />
              </div>
              <button className="flex items-center gap-1.5 rounded-[6px] bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200">
                <Save size={11} /> Save Changes
              </button>
            </div>
          </div>

          {/* AI Engine */}
          <div className="rounded-[7px] border border-console-border p-4">
            <h2 className="mb-3 text-[13px] font-semibold text-console-text">AI Engine Configuration</h2>
            <div className="divide-y divide-white/[0.04]">
              {[
                { label: 'Reasoning Engine', sub: 'Complex architecture and root cause analysis', default: 'Gemini 1.5 Pro' },
                { label: 'Coding Engine',    sub: 'Fast auto-fixes and PR generation',           default: 'Gemini 1.5 Flash' },
              ].map(({ label, sub, default: def }) => (
                <div key={label} className="flex flex-col justify-between gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <div>
                    <div className="text-[13px] font-medium text-console-text">{label}</div>
                    <div className="mt-0.5 text-[11px] text-console-faint">{sub}</div>
                  </div>
                  <select className="h-8 rounded-[6px] border border-console-border bg-console-bg/50 px-2.5 text-[12px] text-console-text outline-none">
                    <option>{def}</option>
                    <option>GPT-4o</option>
                    <option>Claude Sonnet 4.6</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Agent permissions */}
          <div className="rounded-[7px] border border-console-border p-4">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-[13px] font-semibold text-console-text">Agent Permissions</h2>
              <Lock size={12} className="text-console-faint" />
            </div>
            <div className="divide-y divide-white/[0.04]">
              <label className="flex cursor-pointer items-start gap-3 py-3 first:pt-0">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded border-white/20 bg-console-bg/50 text-console-text" />
                <div>
                  <div className="text-[13px] font-medium text-console-text">Auto-Merge PRs</div>
                  <div className="mt-0.5 text-[11px] text-console-faint">
                    Allow agents to merge when tests pass and confidence {'>'} 95%.
                  </div>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-3 py-3 last:pb-0">
                <input type="checkbox" className="mt-0.5 rounded border-white/20 bg-console-bg/50 text-console-text" />
                <div>
                  <div className="text-[13px] font-medium text-console-text">Direct Production Access</div>
                  <div className="mt-0.5 text-[11px] text-console-rose/80">
                    Allow agents to restart services or modify schemas without approval.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
