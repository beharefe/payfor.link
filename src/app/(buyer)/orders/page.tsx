import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false },
};

export default function OrdersPage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "36rem", margin: "0 auto", textAlign: "center" }}>
      <h1>Your orders</h1>
      <p style={{ color: "#666" }}>
        Access your order using the link sent to your email after purchase.
      </p>
    </main>
  );
}
