import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — unseal.link",
  description:
    "4.5% per sale. No monthly fees. No setup costs. You only pay when you earn.",
};

const rows = [
  { price: "$9.99", fee: "$0.45", stripe: "$0.59", receive: "~$8.95" },
  { price: "$19",   fee: "$0.86", stripe: "$0.85", receive: "~$17.29" },
  { price: "$29",   fee: "$1.31", stripe: "$1.14", receive: "~$26.55" },
  { price: "$49",   fee: "$2.21", stripe: "$1.72", receive: "~$45.07" },
  { price: "$99",   fee: "$4.46", stripe: "$3.17", receive: "~$91.37" },
];

const competitors = [
  { name: "Gumroad",       fee: "10%" },
  { name: "Lemon Squeezy", fee: "5%" },
  { name: "Paddle",        fee: "~5%" },
  { name: "Ko-fi",         fee: "5%" },
  { name: "unseal.link",   fee: "4.5%", highlight: true },
];

const benefits = [
  {
    title: "We never hold your money",
    body: "Payments go directly into your Stripe account. We have no access to your funds — ever.",
  },
  {
    title: "Buyers need no account",
    body: "They pay and get their link by email in under 30 seconds. Less friction means more sales.",
  },
  {
    title: "No platform lock-in",
    body: "Your content lives wherever you put it. We just control who gets the link. Switch or leave any time.",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-16 pb-12 max-w-5xl mx-auto px-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
          Pricing
        </p>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-foreground mb-4">
          4.5% per sale.
          <br />
          Nothing else.
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg">
          No monthly fees. No setup costs. You only pay when you earn.
        </p>
      </section>

      {/* Benefits */}
      <section className="border-t border-border py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="border border-border rounded-2xl p-6 bg-card">
                <p className="font-medium text-foreground mb-2">{b.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings table */}
      <section className="border-t border-border py-12 bg-card">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-8">
            Earnings breakdown
          </p>
          <div className="border border-border rounded-2xl overflow-hidden max-w-2xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["Sale price", "Our fee (4.5%)", "Stripe fee", "You receive"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3.5 text-left text-xs font-medium text-muted-foreground tracking-widest uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.price}
                    className={i < rows.length - 1 ? "border-b border-border" : ""}
                  >
                    <td className="px-4 py-3.5 font-medium text-foreground text-sm">
                      {row.price}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground text-sm">
                      {row.fee}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground text-sm">
                      {row.stripe}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-foreground text-sm">
                      {row.receive}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Stripe fee: ~2.9% + $0.30 per transaction, billed by Stripe separately.
          </p>
        </div>
      </section>

      {/* Competitor comparison */}
      <section className="border-t border-border py-12">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-8">
            vs the competition
          </p>
          <div className="border border-border rounded-2xl overflow-hidden max-w-xs">
            {competitors.map((c, i) => (
              <div
                key={c.name}
                className={`flex justify-between items-center px-5 py-3.5 ${i < competitors.length - 1 ? "border-b border-border" : ""} ${c.highlight ? "bg-primary" : ""}`}
              >
                <span className={`${c.highlight ? "font-medium text-primary-foreground" : "text-muted-foreground"} text-sm`}>
                  {c.name}
                </span>
                <span className={`font-medium ${c.highlight ? "text-primary-foreground" : "text-foreground"} text-sm tabular-nums`}>
                  {c.fee}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Platform fee only. Stripe&apos;s processing fee applies on all platforms.</p>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t border-border py-10 bg-card">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap gap-x-8 gap-y-3 items-center">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="text-foreground">✓</span> Payments processed by{" "}
              <span className="font-semibold" style={{ color: "#635BFF" }}>Stripe</span>
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="text-foreground">✓</span> We never touch your funds
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="text-foreground">✓</span> No monthly fees
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="text-foreground">✓</span> Cancel any time
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="text-foreground">✓</span> Buyers need no account
            </span>
          </div>
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
          You earn only when you sell. So do we.
        </p>
      </section>
    </>
  );
}
