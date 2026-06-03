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
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useUser } from '@/components/providers/UserProvider';
import { signOut } from 'next-auth/react';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { name: 'Console',       href: '/console',             icon: LayoutDashboard, shortName: 'Home'  },
      { name: 'Repositories',  href: '/console/repositories', icon: Database,        shortName: 'Repos' },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { name: 'AI Agents',     href: '/console/agents',       icon: Bot,             shortName: 'Agents' },
      { name: 'Bug Fixes',     href: '/console/bugs',         icon: Bug,             shortName: 'Bugs'   },
      { name: 'Security',      href: '/console/bugs',         icon: ShieldCheck,     shortName: 'Sec'    },
      { name: 'Architecture',  href: '/console/architecture', icon: Network,         shortName: 'Arch'   },
      { name: 'Code Review',   href: '/console/prs',          icon: GitPullRequest,  shortName: 'Review' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { name: 'Command Line',  href: '/console/chat',         icon: MessageSquare,   shortName: 'Chat'   },
      { name: 'Monitoring',    href: '/console/monitoring',   icon: Activity,        shortName: 'Monitor'},
      { name: 'Analytics',     href: '/console/analytics',    icon: BarChart2,       shortName: 'Stats'  },
      { name: 'Settings',      href: '/console/settings',     icon: Settings,        shortName: 'Config' },
    ],
  },
];

// Flatten for collapsed icon-only view
const ALL_NAV = NAV_GROUPS.flatMap(g => g.items);

export default function Sidebar() {
  const pathname  = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, workspace } = useUser();

  return (
    <aside
      className={[
        'sticky top-0 hidden h-[100dvh] shrink-0 flex-col',
        'border-r border-white/[0.06]',
        'bg-[#030303]',
        'transition-[width] duration-200 lg:flex',
        collapsed ? 'w-[52px]' : 'w-[210px]',
      ].join(' ')}
    >
      {/* Brand */}
      <div className={[
        'flex h-[52px] shrink-0 items-center border-b border-white/[0.06]',
        collapsed ? 'justify-center px-3' : 'justify-between px-4',
      ].join(' ')}>
        <Link href="/console" className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[5px] bg-white">
            <div className="h-1.5 w-1.5 rounded-full bg-black" />
          </div>
          {!collapsed && (
            <span className="truncate text-[14px] font-semibold tracking-[-0.018em] text-white">
              Continuum
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-zinc-700 transition-colors hover:bg-white/[0.05] hover:text-zinc-400"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={12} />
          </button>
        )}
      </div>

      {/* Scroll region */}
      <div className="flex-1 overflow-y-auto py-3">
        {!collapsed ? (
          /* Expanded: grouped nav */
          <div className="px-2 space-y-0.5">
            {/* Workspace picker */}
            <button className="mb-1 flex w-full items-center justify-between rounded-[6px] px-2 py-1.5 transition-colors hover:bg-white/[0.04]">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[3px] bg-zinc-800 text-[10px] font-bold text-zinc-300">
                  {workspace.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate text-[12px] font-medium text-zinc-400 max-w-[110px]">
                  {workspace.name}
                </span>
              </div>
              <ChevronDown size={11} className="shrink-0 text-zinc-700" />
            </button>

            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-1">
                <div className="mb-0.5 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-700">
                  {group.label}
                </div>
                <nav className="space-y-px">
                  {group.items.map((item) => {
                    const isActive = item.href === '/console'
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <Link key={item.href + item.name} href={item.href} className="group relative block">
                        {isActive && (
                          <motion.div
                            layoutId="active-nav"
                            className="absolute inset-0 rounded-[5px] bg-white/[0.08]"
                            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
                          />
                        )}
                        <div className={[
                          'relative flex h-[30px] items-center gap-2 rounded-[5px] px-2 text-[12px] font-medium transition-colors duration-100',
                          isActive
                            ? 'text-white'
                            : 'text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-300',
                        ].join(' ')}>
                          <Icon size={13} strokeWidth={isActive ? 2 : 1.75} className="shrink-0" />
                          <span className="flex-1 truncate">{item.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        ) : (
          /* Collapsed: icon-only */
          <div className="flex flex-col items-center gap-0.5 px-1.5">
            <button
              onClick={() => setCollapsed(false)}
              className="mb-2 flex h-7 w-7 items-center justify-center rounded-[4px] text-zinc-700 transition-colors hover:bg-white/[0.05] hover:text-zinc-400"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={12} />
            </button>
            {ALL_NAV.map((item) => {
              const isActive = item.href === '/console'
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href + item.name}
                  href={item.href}
                  title={item.name}
                  className={[
                    'flex h-[30px] w-[30px] items-center justify-center rounded-[5px] transition-colors',
                    isActive
                      ? 'bg-white/[0.1] text-white'
                      : 'text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-300',
                  ].join(' ')}
                >
                  <Icon size={13} strokeWidth={isActive ? 2 : 1.75} />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* User footer */}
      <div className="shrink-0 border-t border-white/[0.06] p-2">
        <div className={[
          'group flex items-center rounded-[6px] px-2 py-1.5 transition-colors hover:bg-white/[0.04]',
          collapsed ? 'justify-center' : 'justify-between',
        ].join(' ')}>
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-300">
              {user.name?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase() ?? '?'}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium text-zinc-300">{user.name ?? 'Engineer'}</div>
                <div className="truncate text-[10px] text-zinc-600">{user.email}</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-zinc-600 opacity-0 transition-all hover:bg-white/[0.05] hover:text-zinc-300 group-hover:opacity-100"
              title="Sign Out"
            >
              <LogOut size={12} />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="mt-1 flex h-6 w-full items-center justify-center rounded-[4px] text-zinc-700 transition-colors hover:bg-white/[0.04] hover:text-zinc-400"
            title="Sign Out"
          >
            <LogOut size={12} />
          </button>
        )}
      </div>
    </aside>
  );
}
