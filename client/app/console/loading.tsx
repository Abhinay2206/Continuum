import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center">
      <Loader2 size={32} className="animate-spin text-zinc-500 mb-4" />
      <div className="text-[14px] font-medium text-zinc-400">Loading...</div>
    </div>
  );
}
