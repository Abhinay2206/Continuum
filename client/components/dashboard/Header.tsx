'use client';

import { usePathname } from 'next/navigation';
import { Bell, Command, Search, Cpu } from 'lucide-react';
import { useUser } from '@/components/providers/UserProvider';

const PAGE_LABELS: Record<string, string> = {
  console:      'Dashboard',
  repositories: 'Repositories',
  agents:       'AI Agents',
  bugs:         'Bug Fixes',
  prs:          'Code Review',
  architecture: 'Architecture',
  monitoring:   'Monitoring',
  chat:         'Command Line',
  analytics:    'Analytics',
  settings:     'Settings',
};

function getPageMeta(pathname: string): { label: string; segment: string } {
  const parts = pathname.split('/').filter(Boolean);
  const last = parts[parts.length - 1] ?? 'console';
  return {
    label: PAGE_LABELS[last] ?? last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' '),
    segment: last,
  };
}

export default function Header() {
  const pathname = usePathname();
  const { workspace } = useUser();
  const { label } = getPageMeta(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-[52px] shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] bg-[#030303]/95 px-5 backdrop-blur-sm lg:px-6">

      {/* Left: breadcrumb */}
      <div className="hidden items-center gap-1.5 lg:flex shrink-0">
        <span className="text-[12px] text-zinc-700">{workspace.name}</span>
        <span className="text-zinc-800">/</span>
        <span className="text-[12px] font-medium text-zinc-400">{label}</span>
      </div>

      {/* Center: search */}
      <div className="relative flex-1 md:max-w-[360px] lg:mx-6 lg:flex-none">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search size={12} strokeWidth={2} className="text-zinc-700" />
        </div>
        <input
          type="text"
          placeholder="Search or ask AI…"
          className="h-7 w-full rounded-[6px] border border-white/[0.06] bg-white/[0.02] pl-7 pr-14 text-[12px] text-zinc-300 outline-none placeholder:text-zinc-700 transition-colors focus:border-white/[0.12] focus:bg-white/[0.04]"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <kbd className="flex items-center gap-0.5 rounded-[3px] border border-white/[0.07] px-1 py-px text-[9px] font-medium text-zinc-700">
            <Command size={7} strokeWidth={2.5} />K
          </kbd>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex shrink-0 items-center gap-0.5">
        {/* System status */}
        <div className="mr-1 hidden items-center gap-1.5 rounded-[5px] border border-white/[0.05] bg-white/[0.02] px-2.5 py-1 sm:flex">
          <Cpu size={11} className="text-zinc-700" />
          <span className="text-[10px] font-medium text-zinc-600">Online</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </div>

        <button className="relative flex h-7 w-7 items-center justify-center rounded-[5px] text-zinc-600 transition-colors hover:bg-white/[0.05] hover:text-zinc-400">
          <Bell size={13} strokeWidth={1.75} />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose-400 ring-1 ring-[#030303]" />
        </button>
      </div>
    </header>
  );
}
