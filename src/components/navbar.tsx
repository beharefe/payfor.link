"use client";

import { createClient } from "@unseallink/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Navbar() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
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
          className="font-semibold text-foreground no-underline text-[15px] tracking-tight shrink-0"
        >
          unseal.link
        </Link>
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
            Start selling
          </Link>
        )}
      </nav>
    </header>
  );
}
