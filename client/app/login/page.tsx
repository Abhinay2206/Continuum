'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, GitBranch, Hexagon, LockKeyhole, Sparkles } from 'lucide-react';

const previewItems = [
  ['Agent fleet', '12 active'],
  ['Release risk', 'Low'],
  ['Repos indexed', '38']
];

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/console');
  };

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#030409] text-white selection:bg-sky-300/20 selection:text-white">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(18,24,38,0.95),rgba(3,4,9,0.98)_48%),radial-gradient(circle_at_78%_10%,rgba(56,189,248,0.16),transparent_32%),radial-gradient(circle_at_12%_82%,rgba(139,92,246,0.13),transparent_34%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:76px_76px]" />
      <div className="relative z-10 grid min-h-[100dvh] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_500px]">
        <section className="hidden flex-col justify-between px-12 py-10 lg:flex xl:px-16">
          <Link href="/" className="flex w-fit items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <Image src="/logo.png" alt="Continuum" width={22} height={22} />
            </div>
            <div>
              <span className="block text-[17px] font-semibold tracking-tight">Continuum</span>
              <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-white/36">AI Console</span>
            </div>
          </Link>
          <div className="max-w-3xl py-16">
            <motion.div initial={{ opacity: 1, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/18 bg-sky-300/[0.08] px-3 py-1 text-xs font-medium text-sky-100">
                <Sparkles size={13} />
                Autonomous engineering workspace
              </div>
              <h1 className="mt-6 max-w-2xl text-6xl font-light leading-[1.02] tracking-tight">The command surface for modern software teams.</h1>
              <p className="mt-5 max-w-xl text-[15px] leading-7 text-white/56">Connect your repositories, coordinate AI agents, review production fixes, and keep every release decision in one composed interface.</p>
            </motion.div>
            <motion.div initial={{ opacity: 1, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }} className="mt-10 max-w-3xl rounded-lg border border-white/[0.08] bg-white/[0.04] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl">
              <div className="rounded-md border border-white/[0.06] bg-[#070810]/82 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white/92">Production Console</div>
                    <div className="mt-1 text-xs text-white/38">Acme Corp / release operations</div>
                  </div>
                  <span className="rounded-full border border-emerald-300/18 bg-emerald-300/[0.08] px-2.5 py-1 text-xs font-medium text-emerald-100">Live</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {previewItems.map(([label, value]) => (
                    <div key={label} className="rounded-md border border-white/[0.06] bg-white/[0.035] p-3">
                      <div className="text-xs text-white/38">{label}</div>
                      <div className="mt-2 text-xl font-semibold tracking-tight text-white">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  {['Redis leak patched in backend-core', 'Auth middleware migration ready', 'Billing-service index completed'].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-md border border-white/[0.05] bg-white/[0.025] px-3 py-2.5 text-sm text-white/70">
                      <CheckCircle2 size={15} className="text-emerald-300" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/34">
            <span>SOC 2 ready</span>
            <span>Private by design</span>
            <span>Enterprise SSO</span>
          </div>
        </section>
        <section className="flex min-h-[100dvh] items-start justify-center border-white/[0.07] px-5 py-10 lg:items-center lg:border-l lg:bg-[#070810]/70 lg:backdrop-blur-xl">
          <motion.div initial={{ opacity: 1, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="min-w-0 w-full max-w-[calc(100vw-2rem)] sm:max-w-[420px]">
            <div className="mb-8 flex items-center justify-center lg:hidden">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.045]">
                  <Image src="/logo.png" alt="Continuum" width={22} height={22} />
                </div>
                <span className="text-lg font-semibold tracking-tight">Continuum</span>
              </Link>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.045] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-7">
              <div className="mb-7">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20 text-sky-200">
                  <LockKeyhole size={20} />
                </div>
                <h1 className="text-3xl font-light tracking-tight">Welcome back</h1>
                <p className="mt-2 text-sm leading-6 text-white/46">Sign in to enter the Continuum console.</p>
              </div>
              <div className="space-y-3">
                <button onClick={handleLogin} className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.045] px-4 py-3 text-sm font-medium text-white/86 transition-colors hover:bg-white/[0.075]">
                  <GitBranch size={18} className="text-white/68" />
                  Continue with GitHub
                </button>
                <button onClick={handleLogin} className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.045] px-4 py-3 text-sm font-medium text-white/86 transition-colors hover:bg-white/[0.075]">
                  <Hexagon size={18} className="text-white/68" />
                  Continue with SSO
                </button>
                <div className="flex items-center py-3">
                  <div className="h-px flex-1 bg-white/[0.08]" />
                  <span className="px-4 text-xs text-white/32">or</span>
                  <div className="h-px flex-1 bg-white/[0.08]" />
                </div>
                <form onSubmit={handleLogin} className="space-y-3">
                  <input type="email" placeholder="Work email" className="h-12 w-full rounded-lg border border-white/[0.08] bg-black/20 px-4 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-sky-300/35 focus:ring-2 focus:ring-sky-300/10" required />
                  <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#070810] transition-opacity hover:opacity-90">
                    Sign in <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            </div>
            <p className="mt-6 text-center text-xs leading-5 text-white/34">
              By signing in, you agree to our{' '}
              <Link href="#" className="text-white/58 transition-colors hover:text-white">Terms</Link>
              {' '}and{' '}
              <Link href="#" className="text-white/58 transition-colors hover:text-white">Privacy Policy</Link>
              .
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
