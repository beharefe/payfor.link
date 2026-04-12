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
      , trusted by Amazon, Shopify, and OpenAI.
    </span>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-sm font-medium text-foreground">unseal.link</span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} unseal.link
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">·</span>
              <StripeBadge />
            </div>
          </div>
          <div className="flex items-center gap-5 shrink-0">
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
      </div>
    </footer>
  );
}
