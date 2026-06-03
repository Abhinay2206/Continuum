'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BarChart2,
  Bot,
  Bug,
  ChevronDown,
  Database,
  GitPullRequest,
  LayoutDashboard,
  MessageSquare,
  Network,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useUser } from '@/components/providers/UserProvider';
import { signOut } from 'next-auth/react';

const NAV_ITEMS = [
  { name: 'Console',       href: '/console',               icon: LayoutDashboard, count: null },
  { name: 'Repositories',  href: '/console/repositories',   icon: Database,        count: null },
  { name: 'AI Agents',     href: '/console/agents',         icon: Bot,             count: null },
  { name: 'Bug Fixes',     href: '/console/bugs',           icon: Bug,             count: null },
  { name: 'Pull Requests', href: '/console/prs',            icon: GitPullRequest,  count: null },
  { name: 'Architecture',  href: '/console/architecture',   icon: Network,         count: null },
  { name: 'Monitoring',    href: '/console/monitoring',     icon: Activity,        count: null },
  { name: 'Command Line',  href: '/console/chat',           icon: MessageSquare,   count: null },
  { name: 'Analytics',     href: '/console/analytics',      icon: BarChart2,       count: null },
  { name: 'Settings',      href: '/console/settings',       icon: Settings,        count: null },
];

export default function Sidebar() {
  const pathname  = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, workspace } = useUser();

  return (
    <aside
      className={[
        'sticky top-0 hidden h-[100dvh] shrink-0 flex-col',
        'border-r border-white/[0.06]',
        'bg-[#000]',
        'transition-[width] duration-200 lg:flex',
        collapsed ? 'w-[56px]' : 'w-[216px]',
      ].join(' ')}
    >
      {/* Brand */}
      <div
        className={[
          'flex h-[56px] shrink-0 items-center border-b border-white/[0.06]',
          collapsed ? 'justify-center px-3' : 'justify-between px-4',
        ].join(' ')}
      >
        <Link href="/console" className="flex items-center gap-2.5">
          <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[5px] bg-white">
            <div className="h-2 w-2 rounded-full bg-black" />
          </div>
          {!collapsed && (
            <span className="text-[14px] font-semibold tracking-[-0.015em] text-white">
              Continuum
            </span>
          )}
        </Link>

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="flex h-6 w-6 items-center justify-center rounded-[4px] text-zinc-600 transition-colors hover:bg-white/[0.06] hover:text-zinc-400"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={13} />
          </button>
        )}
      </div>

      {/* Scroll region */}
      <div className="flex-1 overflow-y-auto px-2 py-3">

        {/* Workspace selector */}
        {!collapsed && (
          <button className="mb-2 flex w-full items-center justify-between rounded-[6px] px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] bg-zinc-800 text-[10px] font-semibold text-zinc-300">
                {workspace.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[13px] font-medium text-zinc-300 truncate max-w-[110px]">{workspace.name}</span>
            </div>
            <ChevronDown size={12} className="text-zinc-600" />
          </button>
        )}

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-[4px] text-zinc-600 transition-colors hover:bg-white/[0.06] hover:text-zinc-400"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen size={13} />
          </button>
        )}

        {/* Nav */}
        <nav className="mt-1 space-y-px">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/console'
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            const isAlert = item.count !== null && item.count !== undefined && item.count <= 3;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative block"
                title={collapsed ? item.name : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 rounded-[6px] bg-white/[0.08]"
                    transition={{ type: 'spring', stiffness: 400, damping: 38 }}
                  />
                )}
                <div
                  className={[
                    'relative flex h-[32px] items-center rounded-[6px] transition-colors duration-150',
                    collapsed ? 'justify-center px-1' : 'gap-2.5 px-2',
                    isActive
                      ? 'text-white'
                      : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200',
                  ].join(' ')}
                >
                  <Icon
                    size={14}
                    strokeWidth={isActive ? 2.1 : 1.8}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-[13px] font-medium">{item.name}</span>
                      {item.count !== null && item.count !== undefined && (
                        <span className={[
                          'text-[11px] tabular-nums',
                          isAlert ? 'text-rose-400' : 'text-zinc-600',
                        ].join(' ')}>
                          {item.count}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User */}
      <div className="shrink-0 border-t border-white/[0.06] p-2">
        <div
          className={[
            'group flex items-center justify-between rounded-[6px] px-2 py-1.5 transition-colors hover:bg-white/[0.04]',
            collapsed ? 'justify-center' : '',
          ].join(' ')}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-300">
              {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium text-zinc-300">{user.name || 'Engineer'}</div>
                <div className="truncate text-[11px] text-zinc-600">{user.email}</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-zinc-500 opacity-0 transition-all hover:bg-white/[0.06] hover:text-zinc-300 group-hover:opacity-100"
              title="Sign Out"
            >
              <LogOut size={13} />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="mt-1 mx-auto flex h-6 w-6 items-center justify-center rounded-[4px] text-zinc-600 transition-colors hover:bg-white/[0.06] hover:text-zinc-300"
            title="Sign Out"
          >
            <LogOut size={13} />
          </button>
        )}
      </div>
    </aside>
  );
}
