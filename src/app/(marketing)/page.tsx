import Link from "next/link";

const steps = [
  {
    n: "01",
    title: "Paste any link",
    body: "Notion, Figma, Google Drive, GitHub, Discord — any URL works.",
  },
  {
    n: "02",
    title: "Set a price",
    body: "Minimum $9.99. Connect Stripe once to receive payouts directly.",
  },
  {
    n: "03",
    title: "Share and earn",
    body: "Buyers pay via Stripe and get instant access by email. No accounts needed.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-20 pb-24 px-6 max-w-5xl mx-auto">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
            Sell digital products in minutes
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-medium tracking-tight leading-[1.05] mb-6 text-foreground">
            Sell any link.
            <br />
            Instantly.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed">
            Paste a URL, set a price, share your paywall. Buyers pay once and
            get access — no accounts, no friction.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/auth"
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:opacity-90 transition-opacity no-underline"
            >
              Start selling free
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center px-6 py-3 border border-border rounded-full font-medium text-sm hover:bg-muted transition-colors no-underline text-foreground"
            >
              How it works →
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="border-t border-border py-16 md:py-24">
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
      <section className="border-t border-border py-16 md:py-24 bg-card">
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
              No monthly fees. No setup costs. We earn only when you earn.
              Stripe processing fees apply separately.
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
          Ready to start?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Create an account, connect Stripe, and your first paywall is live in
          under 5 minutes.
        </p>
        <Link
          href="/auth"
          className="inline-flex items-center px-7 py-3.5 bg-primary text-primary-foreground rounded-full font-medium text-base hover:opacity-90 transition-opacity no-underline"
        >
          Get started free →
        </Link>
        <p className="mt-4 text-xs text-muted-foreground">
          No credit card required.
        </p>
      </section>
    </>
  );
}
