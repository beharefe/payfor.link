import { getVerifiedEmail } from "@unseallink/lib/buyer-session";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { OrdersLookup } from "./orders-lookup";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false },
};

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const verifiedEmail = getVerifiedEmail(
    cookieStore.get("orders_session")?.value,
  );

  return (
    <main
      style={{
        padding: "2rem",
        maxWidth: "36rem",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <h1
        style={{ fontSize: "1.5rem", fontWeight: 500, marginBottom: "0.5rem" }}
      >
        Your orders
      </h1>
      {!verifiedEmail && (
        <p style={{ color: "#6B6B6B", marginBottom: "2rem" }}>
          Enter the email you used at checkout. We&apos;ll send you a
          verification code.
        </p>
      )}
      <OrdersLookup verifiedEmail={verifiedEmail} />
    </main>
  );
}
