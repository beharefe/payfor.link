import { TrustBar } from "@unseallink/components/trust-bar";
import Link from "next/link";
import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";

export const metadata: Metadata = {
  title: "Pricing · unseal.link",
  description:
    "4.5% per sale. No monthly fees. No setup costs. Half the fee of Gumroad. You only pay when you earn.",
  alternates: { canonical: `${APP_URL}/pricing` },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Pricing · unseal.link",
  description: "4.5% per sale. No monthly fees. No setup costs.",
  url: `${APP_URL}/pricing`,
  mainEntity: {
    "@type": "Offer",
    name: "unseal.link platform fee",
    description: "4.5% per sale. No monthly fees.",
    price: "0",
    priceCurrency: "USD",
    seller: { "@type": "Organization", name: "unseal.link", url: APP_URL },
  },
};

const rows = [
  { price: "$9.99",  fee: "$0.45", stripe: "$0.59", receive: "~$8.95" },
  { price: "$19",    fee: "$0.86", stripe: "$0.85", receive: "~$17.29" },
  { price: "$29",    fee: "$1.31", stripe: "$1.14", receive: "~$26.55" },
  { price: "$49",    fee: "$2.21", stripe: "$1.72", receive: "~$45.07" },
  { price: "$99",    fee: "$4.46", stripe: "$3.17", receive: "~$91.37" },
  { price: "$199",   fee: "$8.96", stripe: "$6.07", receive: "~$183.97" },
];

const competitors = [
  { name: "Gumroad",       fee: "10%",   note: "highest on this list" },
  { name: "Ko-fi",         fee: "5%",    note: "" },
  { name: "Lemon Squeezy", fee: "5%",    note: "" },
  { name: "Paddle",        fee: "~5%",   note: "" },
  { name: "Payhip",        fee: "5%",    note: "" },
  { name: "unseal.link",   fee: "4.5%",  note: "lowest", highlight: true },
];

const benefits = [
  {
    title: "We never hold your money",
    body: "Payments go directly into your Stripe account. We have no access to your funds. Ever. Stripe is the merchant of record.",
  },
  {
    title: "Buyers need no account",
    body: "They pay and receive the link by email in under 30 seconds. Less friction means more conversions and fewer abandoned checkouts.",
  },
  {
    title: "No platform lock-in",
    body: "Your content lives wherever you put it: Notion, Figma, Google Drive, GitHub. We just control access. Switch or leave any time.",
  },
  {
    title: "No ghosting. Ever.",
    body: "Payment happens before the link is revealed. No more delivering work and hoping the transfer arrives. Get paid first.",
  },
  {
    title: "One price, forever",
    body: "No tiered plans, no feature paywalls, no 'pro' upsells. One flat fee per sale. That's it.",
  },
  {
    title: "Half the cut of Gumroad",
    body: "Gumroad charges 10% per sale. We charge 4.5%. On a $99 product, that's an extra $5.50 in your pocket every single sale.",
  },
];

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
        <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
          No monthly fees. No setup costs. Half the cut of Gumroad. You only
          pay when you earn. So do we.
        </p>
      </section>

      {/* Benefits grid */}
      <section className="border-t border-border py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="border border-border rounded-2xl p-6 bg-card"
              >
                <p className="font-medium text-foreground mb-2">{b.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {b.body}
                </p>
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
                  {[
                    "Sale price",
                    "Our fee (4.5%)",
                    "Stripe fee",
                    "You receive",
                  ].map((h) => (
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
                    className={
                      i < rows.length - 1 ? "border-b border-border" : ""
                    }
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
            Stripe fee: ~2.9% + $0.30 per transaction, billed by Stripe
            directly. Minimum sale price: $9.99.
          </p>
        </div>
      </section>

      {/* Competitor comparison */}
      <section className="border-t border-border py-12">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
            vs the competition
          </p>
          <p className="text-sm text-muted-foreground mb-8 max-w-md">
            Gumroad charges 10%. Lemon Squeezy charges 5%. We charge 4.5%.
            On a $99 product sold 100 times, that&apos;s $550 more in your
            pocket vs Gumroad.
          </p>
          <div className="border border-border rounded-2xl overflow-hidden max-w-sm">
            {competitors.map((c, i) => (
              <div
                key={c.name}
                className={`flex justify-between items-center px-5 py-3.5 ${i < competitors.length - 1 ? "border-b border-border" : ""} ${c.highlight ? "bg-primary" : ""}`}
              >
                <div>
                  <span
                    className={`${c.highlight ? "font-medium text-primary-foreground" : "text-muted-foreground"} text-sm`}
                  >
                    {c.name}
                  </span>
                  {c.note && (
                    <span className="ml-2 text-xs text-muted-foreground opacity-60">
                      {c.note}
                    </span>
                  )}
                </div>
                <span
                  className={`font-medium ${c.highlight ? "text-primary-foreground" : "text-foreground"} text-sm tabular-nums`}
                >
                  {c.fee}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Platform fee only. Stripe&apos;s processing fee (~2.9% + $0.30)
            applies on all platforms.
          </p>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t border-border py-10 bg-card">
        <div className="max-w-5xl mx-auto px-6">
          <TrustBar items={[
            <>Payments processed by <span className="font-semibold" style={{ color: "#635BFF" }}>Stripe</span></>,
            "We never touch your funds",
            "No monthly fees",
            "No contracts",
            "Buyers need no account",
            "Cancel any time",
          ]} />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-20 text-center px-6">
        <h2 className="text-2xl font-medium text-foreground mb-3">
          Ready to stop delivering first?
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
          Get paid before you share anything. Free to start, 4.5% only when
          you sell.
        </p>
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
