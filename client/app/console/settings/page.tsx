'use client';

import { Cpu, GitBranch as Github, Key, Lock, Save, Settings, Shield, Users, Trash2 } from 'lucide-react';
import { useUser } from '@/components/providers/UserProvider';
import { useState } from 'react';

const navItems = [
  { id: 'general',      label: 'General',     icon: Settings, active: true  },
  { id: 'team',         label: 'Team',        icon: Users,    active: false },
  { id: 'integrations', label: 'Integrations',icon: Github,   active: false },
  { id: 'models',       label: 'AI Models',   icon: Cpu,      active: false },
  { id: 'keys',         label: 'API Keys',    icon: Key,      active: false },
  { id: 'security',     label: 'Security',    icon: Shield,   active: false },
];

export default function SettingsPage() {
  const { user, workspace, githubConnected } = useUser();
  const [workspaceName, setWorkspaceName] = useState(workspace.name);

  return (
    <div className="max-w-4xl pb-10">

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-console-text">Settings</h1>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[200px_minmax(0,1fr)]">

        {/* Nav */}
        <div className="rounded-[7px] border border-console-border p-1.5 h-fit">
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

          {/* User profile */}
          <div className="rounded-[7px] border border-console-border p-4">
            <h2 className="mb-3 text-[13px] font-semibold text-console-text">User Profile</h2>
            <div className="flex items-center gap-4">
              {user.image ? (
                <img src={user.image} alt="Avatar" className="h-12 w-12 rounded-full border border-console-border" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-console-border bg-console-bg-soft text-[14px] font-semibold text-zinc-400">
                  {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="space-y-1">
                <div className="text-[14px] font-medium text-white">{user.name || 'Anonymous User'}</div>
                <div className="text-[12px] text-zinc-500">{user.email}</div>
              </div>
            </div>
          </div>

          {/* Workspace profile */}
          <div className="rounded-[7px] border border-console-border p-4">
            <h2 className="mb-3 text-[13px] font-semibold text-console-text">Workspace Settings</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-console-muted">Workspace Name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="h-8 w-full max-w-sm rounded-[6px] border border-console-border bg-console-bg-soft px-3 text-[13px] text-console-text outline-none transition-colors placeholder:text-console-faint focus:border-console-border-strong"
                />
              </div>
              <button className="flex items-center gap-1.5 rounded-[6px] bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200">
                <Save size={11} /> Save Changes
              </button>
            </div>
          </div>

          {/* GitHub Connection */}
          <div className="rounded-[7px] border border-console-border p-4">
            <h2 className="mb-3 text-[13px] font-semibold text-console-text">Integrations</h2>
            <div className="flex items-center justify-between rounded-[6px] border border-white/[0.04] bg-white/[0.01] p-3">
              <div className="flex items-center gap-3">
                <Github size={16} className="text-zinc-400" />
                <div>
                  <div className="text-[13px] font-medium text-console-text">GitHub Connection</div>
                  <div className="mt-0.5 text-[11px] text-zinc-500">
                    {githubConnected ? 'Connected to GitHub account' : 'No account connected'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {githubConnected ? (
                  <>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">Connected</span>
                    <button className="text-[12px] font-medium text-zinc-400 transition-colors hover:text-zinc-200">Disconnect</button>
                  </>
                ) : (
                  <button className="rounded-[6px] bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-zinc-200">
                    Connect
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-[7px] border border-red-500/20 bg-red-500/[0.02] p-4">
            <h2 className="mb-3 text-[13px] font-semibold text-red-400">Danger Zone</h2>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[13px] font-medium text-white">Delete Workspace</div>
                <div className="mt-0.5 max-w-sm text-[11px] text-zinc-500">
                  Permanently remove this workspace, all imported repositories, and generated insights. This action cannot be undone.
                </div>
              </div>
              <button className="flex shrink-0 items-center gap-1.5 rounded-[6px] border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[12px] font-semibold text-red-400 transition-colors hover:bg-red-500/20">
                <Trash2 size={12} /> Delete Workspace
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
