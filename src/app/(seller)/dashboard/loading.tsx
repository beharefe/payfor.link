import { BarChart2, Link2, Package, Settings2 } from "lucide-react";
import Link from "next/link";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className ?? ""}`} />;
}

function DashboardTabsSkeleton() {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-4">
      {[
        { icon: BarChart2, label: "Overview" },
              { icon: Link2,     label: "Links" },
        { icon: Package, label: "Orders" },
        { icon: Settings2, label: "Settings" },
      ].map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground whitespace-nowrap shrink-0">
          <Icon className="w-4 h-4" aria-hidden="true" />
          {label}
        </div>
      ))}
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <main className="min-h-dvh bg-background">
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-medium text-foreground no-underline">unseal.link</Link>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6">
          <DashboardTabsSkeleton />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Revenue chart skeleton */}
        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
            <div className="px-6 py-5 flex flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-12" />
            </div>
            <div className="px-6 py-5 flex flex-col gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
          </div>
          <div className="px-4 pt-6 pb-4">
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        </div>

        {/* Links skeleton */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-border rounded-2xl px-5 py-4 bg-card flex items-center gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-9 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
