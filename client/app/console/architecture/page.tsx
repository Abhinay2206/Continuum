'use client';

import { ArrowRight, Database, Layers, RefreshCw, Server, Zap } from 'lucide-react';
import { ProgressBar, StatusBadge } from '@/components/console/Premium';

const services = [
  { name: 'Web Client',  icon: Layers,   pos: 'left-[7%]  top-[34%]', color: 'text-console-sky'     },
  { name: 'API Gateway', icon: Zap,      pos: 'left-[39%] top-[34%]', color: 'text-violet-400'   },
  { name: 'PostgreSQL',  icon: Database, pos: 'right-[8%] top-[18%]', color: 'text-console-emerald'  },
  { name: 'Redis Cache', icon: Database, pos: 'right-[8%] bottom-[22%]',color: 'text-console-rose'   },
  { name: 'Workers',     icon: Server,   pos: 'left-[39%] bottom-[14%]',color: 'text-console-amber'  },
];

const pressurePoints = [
  { label: 'Auth / Agent Engine', value: 76, tone: 'amber'   as const },
  { label: 'API / Data Models',   value: 48, tone: 'sky'     as const },
  { label: 'Workers / Redis',     value: 32, tone: 'emerald' as const },
];

const recommendations = [
  { title: 'Extract Auth to Microservice',     score: 78, body: 'Reduce API Gateway coupling and deploy risk by 40%.' },
  { title: 'Introduce GraphQL Federation',     score: 62, body: 'Collapse three REST calls into one typed composition.' },
  { title: 'Add Read Replica Routing',         score: 91, body: 'Route reporting workloads away from checkout paths.'  },
];

export default function ArchitecturePage() {
  return (
    <div className="pb-10">

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-console-text">Architecture</h1>
        <button className="flex items-center gap-1.5 rounded-[6px] border border-console-border px-3 py-1.5 text-[12px] font-medium text-console-text transition-colors hover:border-console-border-strong hover:text-console-text">
          <RefreshCw size={12} />
          Sync Topology
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">

        {/* Topology map */}
        <div className="rounded-[7px] border border-console-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-console-text">Production Topology</h2>
            <StatusBadge tone="emerald" pulse>Live</StatusBadge>
          </div>

          <div className="relative h-[420px] overflow-hidden rounded-[6px] bg-console-bg-soft">
            <svg className="absolute inset-0 h-full w-full" style={{ opacity: 0.35 }}>
              <defs>
                <linearGradient id="archLine" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"   stopColor="#38bdf8" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <line x1="17%" y1="43%" x2="44%" y2="43%" stroke="url(#archLine)" strokeWidth="1" strokeDasharray="6 6" />
              <line x1="52%" y1="40%" x2="81%" y2="25%" stroke="url(#archLine)" strokeWidth="1" />
              <line x1="52%" y1="46%" x2="81%" y2="68%" stroke="url(#archLine)" strokeWidth="1" />
              <line x1="47%" y1="48%" x2="47%" y2="76%" stroke="url(#archLine)" strokeWidth="1" strokeDasharray="6 6" />
            </svg>

            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.name}
                  className={`absolute ${service.pos} w-32 rounded-[6px] border border-console-border bg-[#0a0a0a] px-3 py-2.5 text-center transition-colors hover:bg-console-bg-soft`}
                >
                  <Icon size={14} className={`mx-auto mb-1.5 ${service.color}`} />
                  <div className="text-[11px] font-medium text-console-text">{service.name}</div>
                  <div className="mt-0.5 text-[10px] text-console-faint">healthy</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Pressure points */}
          <div className="rounded-[7px] border border-console-border p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-[13px] font-semibold text-console-text">Pressure Points</h2>
            </div>

            {/* Database bottleneck */}
            <div className="mb-3 rounded-[6px] border border-rose-300/20 bg-rose-300/[0.04] px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-console-text">Database bottleneck</span>
                <StatusBadge tone="rose">85% CPU</StatusBadge>
              </div>
              <p className="mt-1 text-[11px] text-console-faint">Read replicas reaching high utilization during checkout bursts.</p>
              <button className="mt-2 flex items-center gap-1 text-[11px] font-medium text-console-rose hover:text-rose-300">
                View mitigation plan <ArrowRight size={10} />
              </button>
            </div>

            {/* Redis hit rate */}
            <div className="rounded-[6px] border border-console-border px-3 py-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[12px] text-console-muted">Redis cache hit rate</span>
                <span className="text-[12px] font-medium text-console-emerald">94.2%</span>
              </div>
              <ProgressBar value={94} tone="emerald" />
            </div>
          </div>

          {/* Coupling index */}
          <div className="rounded-[7px] border border-console-border p-4">
            <h2 className="mb-3 text-[13px] font-semibold text-console-text">Coupling Index</h2>
            <div className="space-y-2.5">
              {pressurePoints.map(({ label, value, tone }) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="text-console-muted">{label}</span>
                    <span className="text-console-faint">{value}%</span>
                  </div>
                  <ProgressBar value={value} tone={tone} />
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="rounded-[7px] border border-console-border p-4">
            <h2 className="mb-3 text-[13px] font-semibold text-console-text">Recommendations</h2>
            <div className="divide-y divide-white/[0.04]">
              {recommendations.map(({ title, score, body }) => (
                <div key={title} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[12px] font-medium text-console-text">{title}</span>
                    <span className="shrink-0 text-[11px] font-semibold text-console-sky">{score}%</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-console-faint">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
