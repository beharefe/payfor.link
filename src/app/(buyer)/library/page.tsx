import {
  createClient,
  createServiceClient,
} from "@payforlink/lib/supabase/server";
import Link from "next/link";
import { LibraryForm } from "./library-form";
import { LibraryList } from "./library-list";

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main style={{ padding: "2rem", maxWidth: "24rem", margin: "0 auto" }}>
        <h1>Your purchases</h1>
        <p>Enter your email to sign in and see your purchases.</p>
        <LibraryForm />
        <p style={{ marginTop: "1rem" }}>
          <Link href="/unlock-request">Request a new access link</Link>
        </p>
      </main>
    );
  }

  const service = createServiceClient();
  const { data: purchases } = await service
    .from("purchases")
    .select("id, product_title, price_paid, currency, created_at")
    .eq("buyer_email", user.email ?? "")
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  return (
    <main style={{ padding: "2rem", maxWidth: "36rem", margin: "0 auto" }}>
      <h1>Your purchases</h1>
      <p>Signed in as {user.email}</p>
      <p>
        <Link href="/auth">Sign out</Link>
      </p>
      {!purchases?.length ? (
        <p>No purchases yet.</p>
      ) : (
        <LibraryList purchases={purchases} />
      )}
      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/unlock-request">Request a new access link by email</Link>
      </p>
    </main>
  );
}
