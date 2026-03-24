import Link from "next/link";
import { ResendUnlockForm } from "./resend-unlock-form";

export default function UnlockRequestPage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "24rem", margin: "0 auto" }}>
      <h1>Get your access link</h1>
      <p>
        Enter the email you used to purchase. We&apos;ll send you a new access
        link.
      </p>
      <ResendUnlockForm />
      <p style={{ marginTop: "1rem" }}>
        <Link href="/orders">View your orders</Link>
      </p>
    </main>
  );
}
