function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className ?? ""}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Revenue chart skeleton */}
      <div className="border border-border rounded-2xl overflow-hidden bg-card">
        <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
          <div className="px-4 py-4 flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
          <div className="px-4 py-4 flex items-center justify-between gap-3">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
        </div>
        <div className="px-4 pt-4 pb-4">
          <Skeleton className="h-[140px] w-full rounded-xl" />
        </div>
      </div>

      {/* Two column grid skeleton */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="border border-border rounded-2xl overflow-hidden bg-card">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-8" />
            </div>
            <div className="divide-y divide-border">
              {[1, 2, 3].map((j) => (
                <div key={j} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-12 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
