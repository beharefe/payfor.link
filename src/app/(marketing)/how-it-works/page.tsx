import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it works — unseal.link",
  description:
    "Paste a link, set a price, share your paywall. Buyers pay via Stripe and get instant access by email.",
};

const sellerSteps = [
  {
    n: "01",
    title: "Create an account",
    body: "Sign in with your email. No password. A magic link lands in your inbox.",
  },
  {
    n: "02",
    title: "Paste your link and set a price",
    body: "Any URL works — Notion, Figma, Google Drive, GitHub, Discord invite, anything.",
  },
  {
    n: "03",
    title: "Connect Stripe to receive payouts",
    body: "Takes about 2 minutes. Stripe handles identity verification and bank payouts.",
  },
  {
    n: "04",
    title: "Share your paywall link anywhere",
    body: "Post it on Twitter, Discord, email, or wherever your audience is.",
  },
];

const buyerSteps = [
  { n: "01", title: "Open the link", body: "See the product title, description, and price." },
  { n: "02", title: "Pay via Stripe", body: "Card, Apple Pay, or Google Pay. Secure checkout." },
  { n: "03", title: "Check your email", body: "Your access link arrives within 30 seconds." },
  {
    n: "04",
    title: "Click unlock",
    body: "One click. Access the content instantly.",
  },
];

function StepList({ steps }: { steps: { n: string; title: string; body: string }[] }) {
  return (
    <div className="divide-y divide-border">
      {steps.map((step) => (
        <div key={step.n} className="flex gap-6 py-6">
          <span className="text-xs font-medium text-muted-foreground font-mono min-w-[2rem] mt-0.5 tabular-nums">
            {step.n}
          </span>
          <div>
            <p className="font-medium text-foreground mb-1">{step.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HowItWorksPage() {
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
          Lock link → Pay → Unlock. Simple for sellers. Simple for buyers.
        </p>
      </section>

      {/* For sellers */}
      <section className="border-t border-border py-12">
        <div className="max-w-5xl mx-auto px-6 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-8">
            For sellers
          </p>
          <StepList steps={sellerSteps} />
        </div>
      </section>

      {/* For buyers */}
      <section className="border-t border-border py-12 bg-card">
        <div className="max-w-5xl mx-auto px-6 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-8">
            For buyers
          </p>
          <StepList steps={buyerSteps} />
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

      {/* CTA */}
      <section className="border-t border-border py-20 text-center px-6">
        <Link
          href="/auth"
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
