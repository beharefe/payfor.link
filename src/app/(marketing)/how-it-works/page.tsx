import { createClient } from "@unseallink/lib/supabase/server";
import { TrustBar } from "@unseallink/components/trust-bar";
import Link from "next/link";
import type { Metadata } from "next";
import { StepsTabs } from "./steps-tabs";

export const metadata: Metadata = {
  title: "How it works · unseal.link",
  description:
    "Paste a link, set a price, share your paywall. Buyers pay via Stripe and get instant access by email.",
};

export default async function HowItWorksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const ctaHref = user ? "/dashboard" : "/auth";
  return (
    <>
      {/* Hero */}
      <section className="pt-16 pb-12 max-w-5xl mx-auto px-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
          Process
        </p>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-foreground mb-4">
          How it works
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg">
          Lock link. Pay. Unlock. Simple for sellers. Simple for buyers.
        </p>
      </section>

      {/* Tabbed steps */}
      <section className="border-t border-border py-12">
        <div className="max-w-2xl mx-auto px-6">
          <StepsTabs />
        </div>
      </section>

      {/* Pricing callout */}
      <section className="border-t border-border py-12">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
            Pricing
          </p>
          <p className="text-2xl font-medium text-foreground mb-3">
            We take 4.5% per sale.
          </p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Stripe processing fees apply (~2.9% + $0.30).</p>
            <p>No monthly fees. No setup costs.</p>
            <p>You only pay when you earn.</p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center mt-6 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors no-underline"
          >
            Full pricing breakdown →
          </Link>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t border-border py-10 bg-card">
        <div className="max-w-5xl mx-auto px-6">
          <TrustBar />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-20 text-center px-6">
        <Link
          href={ctaHref}
          className="inline-flex items-center px-7 py-3.5 bg-primary text-primary-foreground no-underline rounded-full font-medium text-base hover:opacity-90 transition-opacity"
        >
          Start selling free →
        </Link>
        <p className="mt-4 text-xs text-muted-foreground">
          No credit card required to list.
        </p>
      </section>
    </>
  );
}
