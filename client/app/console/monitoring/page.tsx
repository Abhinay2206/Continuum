'use client';

import { AlertTriangle, Cpu, Zap } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TimelineEvent } from '@/components/console/Premium';

const latencyData = [
  { time: '00:00', latency: 32  },
  { time: '03:00', latency: 38  },
  { time: '06:00', latency: 42  },
  { time: '09:00', latency: 45  },
  { time: '12:00', latency: 58  },
  { time: '14:00', latency: 162 },
  { time: '15:00', latency: 88  },
  { time: '18:00', latency: 51  },
  { time: '21:00', latency: 39  },
  { time: '23:00', latency: 35  },
];

const metrics = [
  { label: 'Uptime',      value: '99.99', suffix: '%',  sub: '90 day window',  status: 'healthy',  green: true  },
  { label: 'Avg Latency', value: '45',    suffix: 'ms', sub: 'global edge',    status: '-8ms',     green: true  },
  { label: 'Error Rate',  value: '0.12',  suffix: '%',  sub: 'checkout spike', status: 'watch',    green: false },
  { label: 'CPU Usage',   value: '42',    suffix: '%',  sub: 'worker fleet',   status: 'nominal',  green: true  },
];

export default function MonitoringPage() {
  return (
    <div className="pb-10">

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-console-text">Monitoring</h1>
        <button className="flex items-center gap-1.5 rounded-[6px] border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-[12px] font-medium text-rose-300 transition-colors hover:bg-rose-400/15">
          <Zap size={12} />
          Generate Auto-Fix PR
        </button>
      </div>

      {/* Metrics row */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-[7px] border border-console-border px-4 py-3">
            <div className="text-[28px] font-semibold leading-none tracking-[-0.02em] text-console-text">
              {m.value}<span className="ml-0.5 text-[14px] font-medium text-console-muted">{m.suffix}</span>
            </div>
            <div className="mt-1.5 text-[12px] text-console-muted">{m.label}</div>
            <div className={`mt-0.5 text-[11px] ${m.green ? 'text-console-emerald' : 'text-console-rose'}`}>{m.status}</div>
          </div>
        ))}
      </div>

      {/* Chart + incident */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">

        {/* Latency chart */}
        <div className="rounded-[7px] border border-console-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-console-text">Latency</h2>
            <span className="text-[11px] text-console-rose">1 active incident</span>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="monLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#3f3f46', fontSize: 10 }} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#3f3f46', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '5px', fontSize: '11px' }}
                  itemStyle={{ color: '#a1a1aa' }}
                  cursor={{ stroke: 'rgba(255,255,255,0.04)' }}
                />
                <Area type="monotone" dataKey="latency" stroke="#38bdf8" strokeWidth={1.5} fillOpacity={1} fill="url(#monLatency)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident */}
        <div className="space-y-3">
          <div className="rounded-[7px] border border-rose-300/20 bg-rose-300/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[13px] font-semibold text-console-text">P99 latency spike · /api/checkout</div>
                <p className="mt-1 text-[12px] leading-relaxed text-console-muted">
                  Detected anomaly at 14:00 UTC. AI trace points to database lock contention on orders table.
                </p>
              </div>
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-console-rose" />
            </div>
          </div>

          <div className="overflow-hidden rounded-[6px] border border-console-border font-mono text-[12px]">
            <div className="border-b border-console-border px-3 py-2 text-[11px] text-console-faint">incident.log</div>
            <div className="p-3 text-console-muted">
              <span className="text-console-rose">Error:</span> Connection timeout acquiring database lock.
            </div>
          </div>

          <div className="rounded-[7px] border border-console-border p-3">
            <div className="mb-2 text-[12px] font-semibold text-console-muted">Incident timeline</div>
            <TimelineEvent
              icon={AlertTriangle}
              tone="rose"
              title="Anomaly detected"
              description="Latency crossed baseline by 4x."
              meta="14:00"
            />
            <TimelineEvent
              icon={Cpu}
              tone="amber"
              title="Root cause isolated"
              description="Missing index on orders table - full scans under concurrency."
              meta="14:03"
            />
            <TimelineEvent
              icon={Zap}
              tone="sky"
              title="Auto-fix plan ready"
              description="Index migration + load test queued for approval."
              meta="now"
              last
            />
          </div>
        </div>
      </div>
    </div>
  );
}
