"use client";

import { BarChart2, Link2, Menu, Package, Plus, Settings2, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard",          label: "Overview", icon: BarChart2, exact: true  },
  { href: "/dashboard/links",    label: "Links",    icon: Link2,     exact: false },
  { href: "/dashboard/orders",   label: "Orders",   icon: Package,   exact: true  },
  { href: "/dashboard/settings", label: "Settings", icon: Settings2, exact: true  },
];

export function MobileFABMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on route change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div ref={ref} className="sm:hidden fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Menu panel — appears above the FAB */}
      {open && (
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden w-52">
          <Link
            href="/dashboard/links/new"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity no-underline"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            New link
          </Link>
          <div className="divide-y divide-border">
            {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm no-underline transition-colors ${
                    active
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-xl hover:opacity-90 transition-all"
      >
        {open
          ? <X className="w-5 h-5" aria-hidden="true" />
          : <Menu className="w-5 h-5" aria-hidden="true" />
        }
      </button>
    </div>
  );
}
