import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} unseal.link
        </span>
        <div className="flex items-center gap-5">
          <Link
            href="/pricing"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            Pricing
          </Link>
          <Link
            href="/how-it-works"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            How it works
          </Link>
          <Link
            href="/orders"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            Orders
          </Link>
        </div>
      </div>
    </footer>
  );
}
