import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "#F5F4EF",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(2rem, 6vw, 3.5rem)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          margin: "0 0 1rem",
          color: "#111111",
          lineHeight: 1.1,
        }}
      >
        Sell any link.
        <br />
        Instantly.
      </h1>
      <p
        style={{
          fontSize: "1.1rem",
          color: "#6B6B6B",
          margin: "0 0 2.5rem",
          maxWidth: "26rem",
        }}
      >
        Paste a link, set a price, share your paywall. Buyers pay once and get instant access.
      </p>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/auth"
          style={{
            padding: "0.75rem 1.75rem",
            background: "#111111",
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: "100px",
            fontWeight: 500,
            fontSize: "1rem",
          }}
        >
          Become a seller
        </Link>
        <Link
          href="/orders"
          style={{
            padding: "0.75rem 1.75rem",
            background: "#ffffff",
            color: "#111111",
            textDecoration: "none",
            borderRadius: "100px",
            fontWeight: 500,
            fontSize: "1rem",
            border: "1px solid #E5E5E5",
          }}
        >
          See your orders
        </Link>
      </div>
    </main>
  );
}
