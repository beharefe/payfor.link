import type { Metadata } from "next";
import { OrdersLookup } from "./orders-lookup";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false },
};

export default function OrdersPage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "36rem", margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 500, marginBottom: "0.5rem" }}>Your orders</h1>
      <p style={{ color: "#6B6B6B", marginBottom: "2rem" }}>
        Enter the email you used at checkout. We'll send you a verification code.
      </p>
      <OrdersLookup />
    </main>
  );
}
