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

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex justify-between items-center py-5 px-8 max-w-[64rem] mx-auto">
        <Link
          href="/"
          className="font-medium text-foreground no-underline text-base"
        >
          unseal.link
        </Link>
        <Link
          href="/auth"
          className="px-5 py-2 bg-primary text-primary-foreground no-underline rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Start selling
        </Link>
      </nav>

      {/* Hero */}
      <section className="text-center py-20 px-8 pb-16 max-w-[40rem] mx-auto">
        <h1 className="text-[clamp(2rem,5vw,3rem)] font-medium tracking-tight text-foreground leading-tight mb-4">
          How unseal.link works
        </h1>
        <p className="text-lg text-muted-foreground m-0">
          Lock link → Pay → Unlock. Three steps for sellers. Four for buyers.
        </p>
      </section>

      {/* For sellers */}
      <section className="bg-card py-12 px-8">
        <div className="max-w-[40rem] mx-auto">
          <p className="text-xs font-medium tracking-[0.08em] uppercase text-[#AAAAAA] mb-8">
            For sellers
          </p>
          {sellerSteps.map((step, i) => (
            <div
              key={step.n}
              className={`flex gap-6 py-6 ${i < sellerSteps.length - 1 ? "border-b border-border" : ""}`}
            >
              <span className="text-[0.8rem] font-medium text-[#AAAAAA] min-w-[1.75rem] mt-[0.2rem] tabular-nums">
                {step.n}
              </span>
              <div>
                <p className="font-medium text-foreground mb-1">{step.title}</p>
                <p className="text-sm text-muted-foreground m-0">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* For buyers */}
      <section className="py-12 px-8">
        <div className="max-w-[40rem] mx-auto">
          <p className="text-xs font-medium tracking-[0.08em] uppercase text-[#AAAAAA] mb-8">
            For buyers
          </p>
          {buyerSteps.map((step, i) => (
            <div
              key={step.n}
              className={`flex gap-6 py-6 ${i < buyerSteps.length - 1 ? "border-b border-border" : ""}`}
            >
              <span className="text-[0.8rem] font-medium text-[#AAAAAA] min-w-[1.75rem] mt-[0.2rem] tabular-nums">
                {step.n}
              </span>
              <div>
                <p className="font-medium text-foreground mb-1">{step.title}</p>
                <p className="text-sm text-muted-foreground m-0">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing summary */}
      <section className="bg-card py-12 px-8">
        <div className="max-w-[40rem] mx-auto">
          <p className="text-xs font-medium tracking-[0.08em] uppercase text-[#AAAAAA] mb-8">
            Pricing
          </p>
          <p className="font-medium text-foreground text-lg mb-2">
            We take 4.5% per sale.
          </p>
          <p className="text-muted-foreground text-sm mb-1">
            Stripe processing fees apply (~2.9% + $0.30).
          </p>
          <p className="text-muted-foreground text-sm mb-1">
            No monthly fees. No setup costs.
          </p>
          <p className="text-muted-foreground text-sm">You only pay when you earn.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-20 px-8">
        <Link
          href="/auth"
          className="inline-block px-10 py-3.5 bg-primary text-primary-foreground no-underline rounded-full font-medium text-base hover:opacity-90 transition-opacity"
        >
          Start selling free →
        </Link>
        <p className="mt-4 text-[0.8rem] text-[#AAAAAA]">
          No credit card required to list.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-8 text-center text-[0.8rem] text-[#AAAAAA] flex gap-6 justify-center">
        <Link href="/pricing" className="text-[#AAAAAA] no-underline">
          Pricing
        </Link>
        <Link href="/how-it-works" className="text-[#AAAAAA] no-underline">
          How it works
        </Link>
      </footer>
    </main>
  );
}
