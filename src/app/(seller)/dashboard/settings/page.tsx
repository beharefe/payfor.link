import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InitiateStripeConnectButton, WithdrawButton } from "../dashboard-actions";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: seller } = await supabase
    .from(TABLES.SELLERS)
    .select("name, email, bio, avatar_url, stripe_connected, username")
    .eq("id", user.id)
    .single();

  if (!seller) redirect("/onboarding/name");

  return (
    <main className="min-h-dvh bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">
        {/* Profile section */}
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">Profile</p>
          <div className="border border-border rounded-2xl p-6 bg-card">
            <SettingsForm
              currentName={seller.name ?? ""}
              currentBio={seller.bio ?? ""}
              currentAvatarUrl={seller.avatar_url ?? null}
            />
          </div>
        </div>

        {/* Payouts section */}
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">Payouts</p>
          <div className="border border-border rounded-2xl p-6 bg-card space-y-4">
            {seller.stripe_connected ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-sm font-medium text-foreground">Stripe connected</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Payments go directly to your Stripe account. You keep 95.5% of every sale. Click below to manage your bank account, view payout history, and update your Stripe settings.
                </p>
                <WithdrawButton />
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">Connect Stripe to get paid</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We use Stripe to process payments and send you payouts. You keep 95.5% of every sale. No monthly fees — we only earn when you earn.
                </p>
                <InitiateStripeConnectButton />
              </>
            )}
          </div>
        </div>

        {/* Account section */}
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">Account</p>
          <div className="border border-border rounded-2xl p-6 bg-card space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{seller.email}</p>
            </div>
            {seller.username && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Profile URL</p>
                <a
                  href={`/@${seller.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  /@{seller.username}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
