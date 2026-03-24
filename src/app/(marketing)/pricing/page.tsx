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
    <main
      style={{
        minHeight: "100vh",
        background: "#F5F4EF",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.25rem 2rem",
          maxWidth: "64rem",
          margin: "0 auto",
        }}
      >
        <Link
          href="/"
          style={{ fontWeight: 500, color: "#111111", textDecoration: "none", fontSize: "1rem" }}
        >
          unseal.link
        </Link>
        <Link
          href="/auth"
          style={{
            padding: "0.5rem 1.25rem",
            background: "#111111",
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: "100px",
            fontWeight: 500,
            fontSize: "0.875rem",
          }}
        >
          Start selling
        </Link>
      </nav>

      {/* Hero */}
      <section
        style={{
          textAlign: "center",
          padding: "5rem 2rem 3rem",
          maxWidth: "36rem",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "#111111",
            lineHeight: 1.15,
            margin: "0 0 0.5rem",
          }}
        >
          Simple pricing
        </h1>
        <p
          style={{
            fontSize: "clamp(2.5rem, 8vw, 4rem)",
            fontWeight: 500,
            color: "#111111",
            margin: "1.5rem 0 1rem",
            letterSpacing: "-0.02em",
          }}
        >
          4.5% per sale
        </p>
        <p style={{ fontSize: "1rem", color: "#6B6B6B", margin: "0 0 0.5rem" }}>
          No monthly fees. No setup. No surprises.
        </p>
        <p style={{ fontSize: "1rem", color: "#6B6B6B", margin: 0 }}>
          You keep 95.5% of every sale, minus Stripe&apos;s payment processing fee (~2.9% + $0.30
          per transaction).
        </p>
      </section>

      {/* Earnings table */}
      <section style={{ padding: "2rem", maxWidth: "36rem", margin: "0 auto" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #E5E5E5",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E5E5E5" }}>
                {["Sale price", "Platform fee", "Stripe fee", "You receive"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "0.875rem 1rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      color: "#AAAAAA",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
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
                  style={{ borderBottom: i < rows.length - 1 ? "1px solid #E5E5E5" : "none" }}
                >
                  <td style={{ padding: "0.875rem 1rem", fontWeight: 500, color: "#111111", fontSize: "0.9rem" }}>
                    {row.price}
                  </td>
                  <td style={{ padding: "0.875rem 1rem", color: "#6B6B6B", fontSize: "0.9rem" }}>
                    {row.fee}
                  </td>
                  <td style={{ padding: "0.875rem 1rem", color: "#6B6B6B", fontSize: "0.9rem" }}>
                    {row.stripe}
                  </td>
                  <td style={{ padding: "0.875rem 1rem", fontWeight: 500, color: "#111111", fontSize: "0.9rem" }}>
                    {row.receive}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Competitor comparison */}
      <section style={{ padding: "1rem 2rem 2rem", maxWidth: "36rem", margin: "0 auto" }}>
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#AAAAAA",
            marginBottom: "1rem",
            textAlign: "center",
          }}
        >
          vs the competition
        </p>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #E5E5E5",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          {competitors.map((c, i) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.875rem 1.25rem",
                borderBottom: i < competitors.length - 1 ? "1px solid #E5E5E5" : "none",
                background: c.highlight ? "#111111" : "transparent",
              }}
            >
              <span
                style={{
                  fontWeight: c.highlight ? 500 : 400,
                  color: c.highlight ? "#ffffff" : "#6B6B6B",
                  fontSize: "0.9rem",
                }}
              >
                {c.name}
              </span>
              <span
                style={{
                  fontWeight: 500,
                  color: c.highlight ? "#ffffff" : "#111111",
                  fontSize: "0.9rem",
                }}
              >
                {c.fee}
              </span>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#AAAAAA", marginTop: "1rem" }}>
          Cheapest in market.
        </p>
      </section>

      {/* CTA */}
      <section
        style={{
          textAlign: "center",
          padding: "4rem 2rem",
        }}
      >
        <Link
          href="/auth"
          style={{
            display: "inline-block",
            padding: "0.875rem 2.5rem",
            background: "#111111",
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: "100px",
            fontWeight: 500,
            fontSize: "1rem",
          }}
        >
          Start selling →
        </Link>
        <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#AAAAAA" }}>
          Platform earns only when sellers earn.
        </p>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #E5E5E5",
          padding: "1.5rem 2rem",
          textAlign: "center",
          fontSize: "0.8rem",
          color: "#AAAAAA",
          display: "flex",
          gap: "1.5rem",
          justifyContent: "center",
        }}
      >
        <Link href="/pricing" style={{ color: "#AAAAAA", textDecoration: "none" }}>
          Pricing
        </Link>
        <Link href="/how-it-works" style={{ color: "#AAAAAA", textDecoration: "none" }}>
          How it works
        </Link>
      </footer>
    </main>
  );
}
