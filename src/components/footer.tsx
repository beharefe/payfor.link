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
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-foreground">unseal.link</span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} unseal.link
            </span>
            <StripeBadge />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
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
            My orders
          </Link>
          <Link
            href="/terms"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
