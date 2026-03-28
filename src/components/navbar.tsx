import { createClient } from "@unseallink/lib/supabase/server";
import Link from "next/link";

export async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const loggedIn = !!user;

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <Link
          href="/"
          className="font-semibold text-foreground no-underline text-[15px] tracking-tight shrink-0"
        >
          unseal.link
        </Link>
        <div className="hidden sm:flex items-center gap-6">
          <Link
            href="/how-it-works"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            How it works
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            Pricing
          </Link>
        </div>
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
