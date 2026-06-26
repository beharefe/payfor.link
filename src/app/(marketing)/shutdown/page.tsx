import type { Metadata } from "next";
import Link from "next/link";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";

export const metadata: Metadata = {
  title: "unseal.link is shutting down",
  description:
    "unseal.link is shutting down. Existing buyer access links remain available during the shutdown period.",
  alternates: { canonical: `${APP_URL}/shutdown` },
  robots: { index: true, follow: true },
};

export default function ShutdownPage() {
  return (
    <main className="flex-1 px-6 py-20 md:py-28">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-foreground leading-[1.1]">
          unseal.link is shutting down
        </h1>

        <p className="text-base text-muted-foreground leading-relaxed">
          unseal.link started as a simple way to sell access to private links, templates, files,
          and digital resources.
        </p>

        <p className="text-base text-muted-foreground leading-relaxed">
          We are no longer accepting new sellers, new products, or new purchases.
        </p>

        <p className="text-base text-muted-foreground leading-relaxed">
          Existing buyers can continue using their access links during the shutdown period.
          If you bought something through unseal and need help, contact support.
        </p>

        <p className="text-base text-muted-foreground leading-relaxed">
          Existing sellers can still sign in to view their products and orders during the
          shutdown period.
        </p>

        <div className="border-t border-border pt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Support:{" "}
            <a
              href="mailto:support@unseal.link"
              className="text-foreground underline hover:no-underline"
            >
              support@unseal.link
            </a>
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/orders"
              className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:opacity-90 transition-opacity no-underline"
            >
              View existing order
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center px-5 py-2.5 border border-border rounded-full font-medium text-sm hover:bg-muted transition-colors no-underline text-foreground"
            >
              Seller dashboard
            </Link>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Existing access links will remain available during the shutdown period.
          unseal.link may continue to process refunds, respond to support requests, and maintain
          access-related systems for a limited period to support existing buyers, sellers, disputes,
          and payment-provider obligations.
        </p>
      </div>
    </main>
  );
}
