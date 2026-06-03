'use client';

import { usePathname } from 'next/navigation';
import {
  Bell,
  Command,
  Sparkles,
  UserCircle,
} from 'lucide-react';

import { useUser } from '@/components/providers/UserProvider';

function formatPage(pathname: string) {
  const pathParts = pathname.split('/').filter(Boolean);
  const currentPage = pathParts.length > 1 ? pathParts[pathParts.length - 1] : 'console';
  return currentPage
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function Header() {
  const pathname    = usePathname();
  const currentPage = formatPage(pathname);
  const { workspace } = useUser();

  return (
    <header className="sticky top-0 z-40 flex h-[56px] shrink-0 items-center justify-between border-b border-white/[0.06] bg-black px-5 lg:px-6">

      {/* Breadcrumb */}
      <div className="hidden items-center gap-1.5 text-[13px] lg:flex">
        <span className="text-zinc-600">{workspace.name}</span>
        <span className="mx-0.5 text-zinc-700">/</span>
        <span className="text-zinc-400">{currentPage}</span>
      </div>

      {/* Command bar */}
      <div className="relative flex-1 md:max-w-[400px] lg:mx-8 lg:flex-none">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Sparkles size={13} strokeWidth={2} className="text-zinc-600" />
        </div>
        <input
          type="text"
          placeholder="Ask AI or search…"
          className="h-8 w-full rounded-[6px] border border-white/[0.07] bg-white/[0.025] pl-8 pr-[60px] text-[13px] text-white outline-none placeholder:text-zinc-600 transition-colors focus:border-white/[0.15] focus:bg-white/[0.04]"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
          <kbd className="flex items-center gap-0.5 rounded-[4px] border border-white/[0.07] px-1.5 py-[2px] text-[10px] font-medium text-zinc-600">
            <Command size={8} strokeWidth={2.5} />
            K
          </kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        <button className="relative flex h-8 w-8 items-center justify-center rounded-[6px] text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-300">
          <Bell size={14} strokeWidth={2} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-400" />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-[6px] text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-300">
          <UserCircle size={15} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
