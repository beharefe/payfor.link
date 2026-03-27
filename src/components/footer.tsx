import Link from "next/link";

function StripeBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      Payments by{" "}
      <span
        className="font-semibold"
        style={{ color: "#635BFF" }}
      >
        Stripe
      </span>
    </span>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-5">
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} unseal.link
          </span>
          <StripeBadge />
        </div>
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
