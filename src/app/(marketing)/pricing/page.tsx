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
      <section className="text-center py-20 px-8 pb-12 max-w-2xl mx-auto">
        <h1 className="text-[clamp(2rem,5vw,3rem)] font-medium tracking-tight text-foreground leading-tight mb-2">
          Simple pricing
        </h1>
        <p className="text-[clamp(2.5rem,8vw,4rem)] font-medium text-foreground mt-6 mb-4 tracking-tight">
          4.5% per sale
        </p>
        <p className="text-base text-muted-foreground mb-2">
          No monthly fees. No setup. No surprises.
        </p>
        <p className="text-base text-muted-foreground m-0">
          You keep 95.5% of every sale, minus Stripe&apos;s payment processing fee (~2.9% + $0.30
          per transaction).
        </p>
      </section>

      {/* Earnings table */}
      <section className="p-8 max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                {["Sale price", "Platform fee", "Stripe fee", "You receive"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-left text-xs font-medium text-[#AAAAAA] tracking-[0.04em] uppercase"
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
      </section>

      {/* Competitor comparison */}
      <section className="px-8 pb-8 pt-4 max-w-2xl mx-auto">
        <p className="text-xs font-medium tracking-[0.08em] uppercase text-[#AAAAAA] mb-4 text-center">
          vs the competition
        </p>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
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
                className={`font-medium ${c.highlight ? "text-primary-foreground" : "text-foreground"} text-sm`}
              >
                {c.fee}
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-[0.8rem] text-[#AAAAAA] mt-4">
          Cheapest in market.
        </p>
      </section>

      {/* CTA */}
      <section className="text-center py-16 px-8">
        <Link
          href="/auth"
          className="inline-block px-10 py-3.5 bg-primary text-primary-foreground no-underline rounded-full font-medium text-base hover:opacity-90 transition-opacity"
        >
          Start selling →
        </Link>
        <p className="mt-4 text-[0.8rem] text-[#AAAAAA]">
          Platform earns only when sellers earn.
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
