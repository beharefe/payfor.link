import { createClient } from "@payforlink/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InitiateStripeConnectButton } from "../../dashboard-actions";
import { CopyLinkButton } from "./copy-link-button";

export default async function LinkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: link } = await supabase
    .from("links")
    .select("id, title, slug, status, seller_id")
    .eq("id", id)
    .single();

  if (!link || link.seller_id !== user.id) notFound();

  const { data: seller } = await supabase
    .from("users")
    .select("stripe_connected")
    .eq("id", user.id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const paywallUrl = `${appUrl}/pay/${link.slug}`;

  return (
    <main style={{ padding: "2rem", maxWidth: "36rem", margin: "0 auto" }}>
      <h1>Your paywall is ready</h1>
      <p>
        <Link href="/studio">← Studio</Link>
      </p>

      {!seller?.stripe_connected && (
        <section style={{ marginBottom: "1.5rem", padding: "1rem", border: "1px solid #ccc" }}>
          <p>Connect Stripe to activate this link.</p>
          <InitiateStripeConnectButton />
        </section>
      )}

      <section style={{ marginBottom: "1.5rem" }}>
        <label>Paywall URL</label>
        <p style={{ wordBreak: "break-all", marginTop: "0.25rem" }}>{paywallUrl}</p>
        <CopyLinkButton url={paywallUrl} />
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <p>Share on:</p>
        <ul>
          <li>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(link.title)}&url=${encodeURIComponent(paywallUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </a>
          </li>
          <li>
            <a
              href={`https://discord.com/channels/@me?message=${encodeURIComponent(paywallUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Discord
            </a>
          </li>
          <li>
            <a href={`mailto:?subject=${encodeURIComponent(link.title)}&body=${encodeURIComponent(paywallUrl)}`}>
              Email
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
