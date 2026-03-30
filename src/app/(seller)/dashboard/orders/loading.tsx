import { BarChart2, Link2, Package, Settings2 } from "lucide-react";
import Link from "next/link";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className ?? ""}`} />;
}

export default function OrdersLoading() {
  return (
    <main className="min-h-dvh bg-background">
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-medium text-foreground no-underline">unseal.link</Link>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-4">
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

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          <div className="px-5 py-4 border-b border-border">
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
