export default function LoadingSpinner({ fullPage = false }) {
  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-10 h-10 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-16" />
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
      </div>
    </div>
  );
}
