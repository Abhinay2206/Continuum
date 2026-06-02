'use client';

import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Clock } from 'lucide-react';
import type { ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'ai' | 'slate' | 'sky' | 'violet' | 'emerald' | 'amber' | 'rose';

const toneStyles: Record<Tone, { text: string; border: string; bg: string; dot: string; stroke: string; fill: string }> = {
  neutral: {
    text: 'text-zinc-300',
    border: 'border-white/[0.08]',
    bg: 'bg-white/[0.035]',
    dot: 'bg-zinc-400',
    stroke: '#a1a1aa',
    fill: 'rgba(161,161,170,0.08)',
  },
  slate: {
    text: 'text-zinc-300',
    border: 'border-white/[0.08]',
    bg: 'bg-white/[0.035]',
    dot: 'bg-zinc-400',
    stroke: '#a1a1aa',
    fill: 'rgba(161,161,170,0.08)',
  },
  success: {
    text: 'text-emerald-300',
    border: 'border-emerald-400/15',
    bg: 'bg-emerald-400/[0.055]',
    dot: 'bg-emerald-400',
    stroke: '#34d399',
    fill: 'rgba(52,211,153,0.08)',
  },
  emerald: {
    text: 'text-emerald-300',
    border: 'border-emerald-400/15',
    bg: 'bg-emerald-400/[0.055]',
    dot: 'bg-emerald-400',
    stroke: '#34d399',
    fill: 'rgba(52,211,153,0.08)',
  },
  warning: {
    text: 'text-amber-300',
    border: 'border-amber-400/15',
    bg: 'bg-amber-400/[0.055]',
    dot: 'bg-amber-400',
    stroke: '#fbbf24',
    fill: 'rgba(251,191,36,0.08)',
  },
  amber: {
    text: 'text-amber-300',
    border: 'border-amber-400/15',
    bg: 'bg-amber-400/[0.055]',
    dot: 'bg-amber-400',
    stroke: '#fbbf24',
    fill: 'rgba(251,191,36,0.08)',
  },
  danger: {
    text: 'text-rose-300',
    border: 'border-rose-400/15',
    bg: 'bg-rose-400/[0.055]',
    dot: 'bg-rose-400',
    stroke: '#fb7185',
    fill: 'rgba(251,113,133,0.08)',
  },
  rose: {
    text: 'text-rose-300',
    border: 'border-rose-400/15',
    bg: 'bg-rose-400/[0.055]',
    dot: 'bg-rose-400',
    stroke: '#fb7185',
    fill: 'rgba(251,113,133,0.08)',
  },
  ai: {
    text: 'text-sky-200',
    border: 'border-sky-300/15',
    bg: 'bg-sky-300/[0.055]',
    dot: 'bg-sky-300',
    stroke: '#7dd3fc',
    fill: 'rgba(125,211,252,0.08)',
  },
  sky: {
    text: 'text-sky-200',
    border: 'border-sky-300/15',
    bg: 'bg-sky-300/[0.055]',
    dot: 'bg-sky-300',
    stroke: '#7dd3fc',
    fill: 'rgba(125,211,252,0.08)',
  },
  violet: {
    text: 'text-violet-200',
    border: 'border-violet-300/15',
    bg: 'bg-violet-300/[0.055]',
    dot: 'bg-violet-300',
    stroke: '#a78bfa',
    fill: 'rgba(167,139,250,0.08)',
  },
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}


export function StatusBadge({
  children,
  tone = 'neutral',
  pulse = false,
}: {
  children: ReactNode;
  tone?: Tone;
  pulse?: boolean;
}) {
  const style = toneStyles[tone];

  return (
    <span
      className={cx(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium leading-none',
        style.border,
        style.bg,
        style.text,
      )}
    >
      {pulse && <span className={cx('h-1.5 w-1.5 rounded-full', style.dot)} />}
      {children}
    </span>
  );
}


export function ProgressBar({
  value,
  tone = 'neutral',
}: {
  value: number;
  tone?: Tone;
}) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{
          width: `${value}%`,
          background: toneStyles[tone].stroke,
        }}
      />
    </div>
  );
}


export function TimelineEvent({
  icon: Icon = CheckCircle2,
  title,
  description,
  meta,
  tone = 'neutral',
  last = false,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  meta: string;
  tone?: Tone;
  last?: boolean;
}) {
  const style = toneStyles[tone];

  return (
    <div className="relative flex gap-4 py-3">
      {!last && <div className="absolute left-[17px] top-10 h-[calc(100%-1rem)] w-px bg-white/[0.08]" />}
      <div className={cx('z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-[#0d0d0f]', style.border, style.text)}>
        <Icon size={14} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h3 className="text-sm font-medium leading-5 text-zinc-100">{title}</h3>
          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
            <Clock size={11} strokeWidth={2} />
            {meta}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

