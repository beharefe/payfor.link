function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className ?? ""}`} />;
}

export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Profile section */}
      <div>
        <Skeleton className="h-3 w-16 mb-6" />
        <div className="border border-border rounded-2xl p-6 bg-card flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </div>

      {/* Payouts section */}
      <div>
        <Skeleton className="h-3 w-16 mb-6" />
        <div className="border border-border rounded-2xl p-6 bg-card flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-9 w-28 rounded-full shrink-0" />
        </div>
      </div>

      {/* Account section */}
      <div>
        <Skeleton className="h-3 w-16 mb-6" />
        <div className="border border-border rounded-2xl p-6 bg-card space-y-3">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
