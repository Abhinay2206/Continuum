'use client';

import { Bar, BarChart, Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const codeQualityData = [
  { name: 'W1', score: 72 },
  { name: 'W2', score: 78 },
  { name: 'W3', score: 82 },
  { name: 'W4', score: 89 },
  { name: 'W5', score: 94 },
];

const contributionData = [
  { name: 'backend',    lines: 4000 },
  { name: 'web-client', lines: 2500 },
  { name: 'data-pipe',  lines: 1800 },
  { name: 'auth',       lines: 800  },
];

const metrics = [
  { label: 'Time Saved',      value: '420', suffix: 'hrs', trend: '+38h',  up: true  },
  { label: 'AI Authored',     value: '34',  suffix: '%',   trend: '+12%',  up: true  },
  { label: 'Bugs Prevented',  value: '1.2k',               trend: '+18%',  up: true  },
  { label: 'Team Velocity',   value: '+45', suffix: '%',   trend: 'up',    up: true  },
];

const insights = [
  { title: 'Review compression',   body: 'AI summaries reduced average review time by 41%.' },
  { title: 'Regression prevention',body: 'Generated tests caught 29 edge cases before release.' },
  { title: 'Repository leverage',  body: 'backend-core has the highest automation ROI this period.' },
];

export default function AnalyticsPage() {
  return (
    <div className="pb-10">

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-console-text">Analytics</h1>
        <div className="flex items-center gap-0.5 rounded-[6px] border border-console-border p-0.5">
          {['30 Days', '90 Days', 'YTD'].map((period, i) => (
            <button
              key={period}
              className={[
                'rounded-[4px] px-3 py-1 text-[11px] font-medium transition-colors',
                i === 0 ? 'bg-console-border text-console-text' : 'text-console-faint hover:text-console-muted',
              ].join(' ')}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics row */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-[7px] border border-console-border px-4 py-3">
            <div className="text-[32px] font-semibold leading-none tracking-[-0.03em] text-console-text">
              {m.value}
              {m.suffix && <span className="ml-0.5 text-[14px] font-medium text-console-muted">{m.suffix}</span>}
            </div>
            <div className="mt-1.5 text-[12px] text-console-muted">{m.label}</div>
            <div className={`mt-0.5 text-[11px] ${m.up ? 'text-console-emerald' : 'text-console-rose'}`}>{m.trend}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mb-5 grid gap-5 xl:grid-cols-2">

        <div className="rounded-[7px] border border-console-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-console-text">Code Quality</h2>
            <span className="text-[11px] text-console-emerald">94/100</span>
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={codeQualityData} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="aqQuality" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#34d399" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#3f3f46', fontSize: 10 }} dy={6} />
                <YAxis domain={[60, 100]} axisLine={false} tickLine={false} tick={{ fill: '#3f3f46', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '5px', fontSize: '11px' }}
                  itemStyle={{ color: '#a1a1aa' }}
                  cursor={{ stroke: 'rgba(255,255,255,0.04)' }}
                />
                <Area type="monotone" dataKey="score" stroke="#34d399" strokeWidth={1.5} fillOpacity={1} fill="url(#aqQuality)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[7px] border border-console-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-console-text">AI Contribution by Repository</h2>
            <span className="text-[11px] text-violet-400">34%</span>
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contributionData} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#3f3f46', fontSize: 10 }} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#3f3f46', fontSize: 10 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '5px', fontSize: '11px' }}
                  itemStyle={{ color: '#a1a1aa' }}
                />
                <Bar dataKey="lines" fill="#7c3aed" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid gap-3 md:grid-cols-3">
        {insights.map(({ title, body }) => (
          <div key={title} className="rounded-[7px] border border-console-border px-4 py-3">
            <div className="text-[12px] font-semibold text-console-text">{title}</div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-console-muted">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
