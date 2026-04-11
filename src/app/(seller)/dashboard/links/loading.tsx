function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className ?? ""}`} />;
}

export default function LinksLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-border rounded-2xl px-5 py-4 bg-card flex items-center gap-4">
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <Skeleton className="h-4 w-full max-w-[13rem]" />
              <Skeleton className="h-3 w-full max-w-[8rem]" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
