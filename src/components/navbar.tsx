"use client";

import { createClient } from "@unseallink/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Navbar({ isShutdown = false }: { isShutdown?: boolean }) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  useEffect(() => {
    setLastOrderId(localStorage.getItem("last_order_id"));
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <Link
          href="/"
          className="no-underline shrink-0 text-[#3D3530] dark:text-[#F0EDE8]"
          style={{ fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 600, letterSpacing: "-0.3px" }}
        >
          unseal.link
        </Link>
        <div className="flex items-center gap-4">
          {!isShutdown && (
            <Link
              href="/discover"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline shrink-0 hidden sm:block"
            >
              Discover
            </Link>
          )}
          {!loggedIn && lastOrderId && (
            <Link
              href={`/orders?oid=${lastOrderId}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline shrink-0"
            >
              My purchase →
            </Link>
          )}
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="shrink-0 px-4 py-2 bg-primary text-primary-foreground no-underline rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/auth"
              className="shrink-0 px-4 py-2 bg-primary text-primary-foreground no-underline rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
            >
              {isShutdown ? "Sign in" : "Start selling"}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
