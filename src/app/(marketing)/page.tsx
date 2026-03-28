import Link from "next/link";
import { HeroCTA, HeroHeadline } from "./hero-ab";

const useCases = [
  { icon: "📄", label: "Notion templates" },
  { icon: "🎨", label: "Figma files" },
  { icon: "📁", label: "Google Drive folders" },
  { icon: "💬", label: "Discord invites" },
  { icon: "💻", label: "GitHub repos" },
  { icon: "📹", label: "Loom / video links" },
  { icon: "📋", label: "Airtable bases" },
  { icon: "📦", label: "Any URL" },
];

const steps = [
  {
    n: "01",
    title: "Paste any link",
    body: "Notion, Figma, Google Drive, GitHub, Discord — any URL you already own.",
  },
  {
    n: "02",
    title: "Set a price",
    body: "Minimum $9.99. Connect Stripe once and all payouts land directly in your bank.",
  },
  {
    n: "03",
    title: "Share the paywall",
    body: "Buyers pay via Stripe and receive the link by email — no account required, under 30 seconds.",
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

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-20 pb-24 px-6 max-w-5xl mx-auto">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
            The paywall for any link
          </p>

          {/* A/B tested headline — client component, falls back to variant A on SSR */}
          <HeroHeadline />

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed">
            Paste a URL, set a price, share your paywall link. Buyers pay once
            and receive access by email — no accounts, no friction, under 30
            seconds.
          </p>

          <div className="flex flex-wrap gap-3">
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

          {/* Trust bar */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-8">
            <span className="text-xs text-muted-foreground">
              Payments by{" "}
              <span className="font-semibold" style={{ color: "#635BFF" }}>
                Stripe
              </span>
            </span>
            <span className="text-xs text-muted-foreground">
              · No monthly fees
            </span>
            <span className="text-xs text-muted-foreground">
              · Buyers need no account
            </span>
            <span className="text-xs text-muted-foreground">
              · Instant delivery
            </span>
            <span className="text-xs text-muted-foreground">
              · 4.5% per sale
            </span>
          </div>
        </div>
      </section>

      {/* What you can sell */}
      <section className="border-t border-border py-16 md:py-20 bg-card">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-10">
            Sell anything with a URL
          </p>
          <div className="flex flex-wrap gap-3">
            {useCases.map((u) => (
              <span
                key={u.label}
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-full text-sm text-foreground bg-background"
              >
                <span>{u.icon}</span>
                {u.label}
              </span>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground max-w-md leading-relaxed">
            If it has a URL, you can paywall it. Your content stays where it
            lives — we just control who gets the link.
          </p>
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
          label="Get started free →"
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
