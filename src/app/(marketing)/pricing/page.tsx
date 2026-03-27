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

      {/* Earnings table */}
      <section className="border-t border-border py-12">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-8">
            Earnings breakdown
          </p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden max-w-2xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["Sale price", "Platform fee", "Stripe fee", "You receive"].map((h) => (
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
            Stripe processing fee: ~2.9% + $0.30 per transaction.
          </p>
        </div>
      </section>

      {/* Competitor comparison */}
      <section className="border-t border-border py-12 bg-card">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-8">
            vs the competition
          </p>
          <div className="border border-border rounded-2xl overflow-hidden max-w-sm">
            {competitors.map((c, i) => (
              <div
                key={c.name}
                className={`flex justify-between items-center px-5 py-3.5 ${i < competitors.length - 1 ? "border-b border-border" : ""} ${c.highlight ? "bg-primary" : ""}`}
              >
                <span
                  className={`${c.highlight ? "font-medium text-primary-foreground" : "text-muted-foreground"} text-sm`}
                >
                  {c.name}
                </span>
                <span
                  className={`font-medium ${c.highlight ? "text-primary-foreground" : "text-foreground"} text-sm tabular-nums`}
                >
                  {c.fee}
                </span>
              </div>
            ))}
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
          Platform earns only when you earn.
        </p>
      </section>
    </>
  );
}
