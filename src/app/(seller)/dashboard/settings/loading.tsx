import { BarChart2, Link2, Package, Settings2 } from "lucide-react";
import Link from "next/link";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className ?? ""}`} />;
}

export default function SettingsLoading() {
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
        <div className="max-w-5xl mx-auto px-6 pb-4">
          <div className="flex items-center gap-1">
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
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* Avatar + name row */}
        <div className="border border-border rounded-2xl p-6 bg-card flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>

        {/* Form fields skeleton */}
        <div className="border border-border rounded-2xl p-6 bg-card space-y-6">
          {[120, 80, 160].map((w, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className={`h-10 w-full rounded-xl`} />
              <Skeleton className={`h-3 w-${w}`} />
            </div>
          ))}
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>

        {/* Stripe section skeleton */}
        <div className="border border-border rounded-2xl p-6 bg-card flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-9 w-28 rounded-full shrink-0" />
        </div>
      </div>
    </main>
  );
}
