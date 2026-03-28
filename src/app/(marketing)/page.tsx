import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { HeroCTA, HeroHeadline } from "./hero-ab";
import { ProductScroll } from "./product-scroll";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";

export const metadata: Metadata = {
  title: "unseal.link -- Sell any link, instantly",
  description:
    "Paste a URL, set a price, share your paywall. Buyers pay once and get instant access by email. Keep 95.5% of every sale. No monthly fees.",
  alternates: { canonical: APP_URL },
  openGraph: {
    title: "unseal.link -- Sell any link, instantly",
    description:
      "Paste a URL, set a price, share your paywall. Buyers pay once and get instant access by email. Keep 95.5% of every sale.",
    url: APP_URL,
    siteName: "unseal.link",
    type: "website",
    images: [{ url: `${APP_URL}/api/og`, width: 1200, height: 630 }],
  },
};

const trustItems = [
  <>Payments by <span className="font-semibold" style={{ color: "#635BFF" }}>Stripe</span></>,
  "No monthly fees",
  "Buyers need no account",
  "Instant delivery by email",
  "4.5% per sale only",
  "Cancel any time",
];

const steps = [
  {
    n: "01",
    title: "Paste any link",
    body: "Notion, Figma, Google Drive, GitHub, Discord -- any URL you already own.",
  },
  {
    n: "02",
    title: "Set a price",
    body: "Minimum $9.99. Connect Stripe once and all payouts land directly in your bank.",
  },
  {
    n: "03",
    title: "Share the paywall",
    body: "Buyers pay via Stripe and receive the link by email -- no account required, under 30 seconds.",
  },
];

const painPoints = [
  {
    problem: "Sent the file before payment cleared?",
    fix: "Now the link only unlocks after Stripe confirms the charge.",
  },
  {
    problem: "Client ghosted after you delivered?",
    fix: "Payment happens first. Always. No exceptions.",
  },
  {
    problem: "Tired of Gumroad's 10% cut?",
    fix: "We take 4.5%. Half the fee, same instant delivery.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "unseal.link",
  applicationCategory: "BusinessApplication",
  url: APP_URL,
  description:
    "Paste any link, set a price, share your paywall. Buyers pay via Stripe and receive access by email. 4.5% per sale, no monthly fees.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free to list. 4.5% platform fee per sale.",
  },
  publisher: {
    "@type": "Organization",
    name: "unseal.link",
    url: APP_URL,
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero */}
      <section className="pt-20 pb-16 px-6 max-w-5xl mx-auto">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
            The paywall for any link
          </p>

          <HeroHeadline />

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed">
            Paste a URL, set a price, share your paywall link. Buyers pay once
            and receive access by email -- no accounts, no friction, under 30
            seconds.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            <HeroCTA
              href="/auth"
              label="Start selling free"
              location="hero_primary"
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:opacity-90 transition-opacity no-underline"
            />
            <HeroCTA
              href="/pricing"
              label="See pricing"
              location="hero_secondary"
              className="inline-flex items-center px-6 py-3 border border-border rounded-full font-medium text-sm hover:bg-muted transition-colors no-underline text-foreground"
            />
          </div>

          {/* Trust bar — 2-col grid on mobile, single row on md+ */}
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-x-6 gap-y-2.5">
            {trustItems.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Check
                  className="size-3 shrink-0 text-foreground"
                  aria-hidden="true"
                />
                <span className="text-xs text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you can sell — scrollable cards */}
      <section className="border-t border-border py-14 bg-card overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between px-6 mb-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
                Sell anything with a URL
              </p>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                If it has a URL, you can paywall it. Your content stays where it
                lives -- we just control who gets the link.
              </p>
            </div>
          </div>
          <ProductScroll />
        </div>
      </section>

      {/* Pain points */}
      <section className="border-t border-border py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-12">
            Built for people who got burned
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {painPoints.map((p) => (
              <div
                key={p.problem}
                className="border border-border rounded-2xl p-6 bg-card"
              >
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {p.problem}
                </p>
                <p className="font-medium text-foreground text-sm leading-relaxed">
                  {p.fix}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="border-t border-border py-16 md:py-24 bg-card">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-12">
            Three steps
          </p>
          <div className="grid sm:grid-cols-3 gap-10">
            {steps.map((step) => (
              <div key={step.n}>
                <span className="text-xs font-medium text-muted-foreground font-mono">
                  {step.n}
                </span>
                <h3 className="text-lg font-medium mt-3 mb-2 text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing callout */}
      <section className="border-t border-border py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
              Pricing
            </p>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground mb-4">
              4.5% per sale.
              <br />
              Nothing else.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-md">
              No monthly fees. No setup costs. Gumroad charges 10%. We charge
              4.5%. You keep the rest. We earn only when you earn.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center text-sm font-medium text-foreground hover:text-muted-foreground transition-colors no-underline"
            >
              See full pricing breakdown →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border py-24 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground mb-4">
          Stop delivering first.
        </h2>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Create an account, connect Stripe, and your first paywall is live in
          under 5 minutes. No storefront needed.
        </p>
        <HeroCTA
          href="/auth"
          label="Get started free"
          location="footer_cta"
          className="inline-flex items-center px-7 py-3.5 bg-primary text-primary-foreground rounded-full font-medium text-base hover:opacity-90 transition-opacity no-underline"
        />
        <p className="mt-4 text-xs text-muted-foreground">
          No credit card required to list.
        </p>
      </section>
    </>
  );
}
