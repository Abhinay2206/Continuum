import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] overflow-hidden bg-[var(--console-bg)] text-[#eef1f8] selection:bg-cyan-300/20 selection:text-white">
      <Sidebar />
      <div className="relative flex h-[100dvh] min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="relative min-w-0 flex-1 overflow-y-auto px-5 py-5 lg:px-8">
          <div className="relative z-10 mx-auto w-full max-w-[1480px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
