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
          padding: "5rem 2rem 4rem",
          maxWidth: "40rem",
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
            margin: "0 0 1rem",
          }}
        >
          How unseal.link works
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#6B6B6B", margin: 0 }}>
          Lock link → Pay → Unlock. Three steps for sellers. Four for buyers.
        </p>
      </section>

      {/* For sellers */}
      <section
        style={{
          background: "#ffffff",
          padding: "3rem 2rem",
        }}
      >
        <div style={{ maxWidth: "40rem", margin: "0 auto" }}>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#AAAAAA",
              marginBottom: "2rem",
            }}
          >
            For sellers
          </p>
          {sellerSteps.map((step, i) => (
            <div
              key={step.n}
              style={{
                display: "flex",
                gap: "1.5rem",
                padding: "1.5rem 0",
                borderBottom: i < sellerSteps.length - 1 ? "1px solid #E5E5E5" : "none",
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "#AAAAAA",
                  minWidth: "1.75rem",
                  marginTop: "0.2rem",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {step.n}
              </span>
              <div>
                <p style={{ fontWeight: 500, color: "#111111", margin: "0 0 0.25rem" }}>
                  {step.title}
                </p>
                <p style={{ fontSize: "0.9rem", color: "#6B6B6B", margin: 0 }}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* For buyers */}
      <section style={{ padding: "3rem 2rem" }}>
        <div style={{ maxWidth: "40rem", margin: "0 auto" }}>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#AAAAAA",
              marginBottom: "2rem",
            }}
          >
            For buyers
          </p>
          {buyerSteps.map((step, i) => (
            <div
              key={step.n}
              style={{
                display: "flex",
                gap: "1.5rem",
                padding: "1.5rem 0",
                borderBottom: i < buyerSteps.length - 1 ? "1px solid #E5E5E5" : "none",
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "#AAAAAA",
                  minWidth: "1.75rem",
                  marginTop: "0.2rem",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {step.n}
              </span>
              <div>
                <p style={{ fontWeight: 500, color: "#111111", margin: "0 0 0.25rem" }}>
                  {step.title}
                </p>
                <p style={{ fontSize: "0.9rem", color: "#6B6B6B", margin: 0 }}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing summary */}
      <section
        style={{
          background: "#ffffff",
          padding: "3rem 2rem",
        }}
      >
        <div style={{ maxWidth: "40rem", margin: "0 auto" }}>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#AAAAAA",
              marginBottom: "2rem",
            }}
          >
            Pricing
          </p>
          <p style={{ fontWeight: 500, color: "#111111", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
            We take 4.5% per sale.
          </p>
          <p style={{ color: "#6B6B6B", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
            Stripe processing fees apply (~2.9% + $0.30).
          </p>
          <p style={{ color: "#6B6B6B", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
            No monthly fees. No setup costs.
          </p>
          <p style={{ color: "#6B6B6B", fontSize: "0.9rem" }}>You only pay when you earn.</p>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          textAlign: "center",
          padding: "5rem 2rem",
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
          Start selling free →
        </Link>
        <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#AAAAAA" }}>
          No credit card required to list.
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
