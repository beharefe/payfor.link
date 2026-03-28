"use client";

import { BarChart2, Link2, Package, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard",         label: "Overview", icon: BarChart2, exact: true },
  { href: "/dashboard/links",   label: "Links",    icon: Link2,     exact: false },
  { href: "/dashboard/orders",  label: "Orders",   icon: Package,   exact: true },
  { href: "/dashboard/settings",label: "Settings", icon: Settings2, exact: true },
];

export function DashboardTabs() {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
      {TABS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors no-underline shrink-0 ${
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
