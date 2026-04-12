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
      {" "}— the same infrastructure used by Amazon, Shopify, and OpenAI.
    </span>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-3 max-w-sm">
          <span className="text-sm font-medium text-foreground">unseal.link</span>
          <StripeBadge />
          <p className="text-xs text-muted-foreground leading-relaxed">
            We never hold your funds. Every sale pays out directly to your
            connected Stripe account. No $100 minimum. No weekly batch.
            Your money, immediately.
          </p>
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} unseal.link
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
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
