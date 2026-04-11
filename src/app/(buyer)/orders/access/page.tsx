import { hashAccessToken } from "@unseallink/lib/access-token";
import { TABLES } from "@unseallink/lib/db";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import { Lock, Unlock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ConsumeTokenButton } from "./consume-token-button";

export const metadata: Metadata = {
  robots: { index: false },
};

type Props = { searchParams: Promise<{ t?: string; oid?: string }> };

export default async function AccessPage({ searchParams }: Props) {
  const { t: rawToken, oid: orderId } = await searchParams;

  if (!rawToken || !orderId) {
    return <ErrorState message="Invalid access link." />;
  }

  const hash = hashAccessToken(rawToken);
  const supabase = createServiceClient();

  const { data: token } = await supabase
    .from(TABLES.ACCESS_TOKENS)
    .select("id, used_at, expires_at, order_id")
    .eq("token_hash", hash)
    .eq("order_id", orderId)
    .single();

  if (!token) {
    return <ErrorState message="This access link is invalid or has expired." orderId={orderId} />;
  }

  if (token.used_at) {
    return <ErrorState message="This link has already been used." orderId={orderId} showResend />;
  }

  if (new Date(token.expires_at) < new Date()) {
    return (
      <ErrorState
        message="This link has expired (valid for 24 hours)."
        orderId={orderId}
        showResend
      />
    );
  }

  // Load order info for display
  const { data: order } = await supabase
    .from(TABLES.ORDERS)
    .select("product_title, buyer_email")
    .eq("id", orderId)
    .single();

  return (
    <main className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center mb-2">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center size-12 rounded-full bg-muted">
              <Unlock className="size-5 text-foreground" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-foreground mb-1">
            Ready to unseal
          </h1>
          <p className="text-muted-foreground text-sm">
            Click below to access your purchase.
          </p>
        </div>

        <div className="border border-border rounded-2xl p-6 bg-card space-y-4">
          {order && (
            <div className="flex flex-col gap-1.5 text-sm">
              <p className="font-medium text-foreground leading-snug">{order.product_title}</p>
              <p className="text-muted-foreground text-xs">{order.buyer_email}</p>
            </div>
          )}
          <ConsumeTokenButton rawToken={rawToken} orderId={orderId} />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          This link can only be used once.
        </p>
      </div>
    </main>
  );
}

function ErrorState({
  message,
  orderId,
  showResend,
}: {
  message: string;
  orderId?: string;
  showResend?: boolean;
}) {
  return (
    <main className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="flex items-center justify-center mb-1">
          <div className="flex items-center justify-center size-12 rounded-full bg-muted">
            <Lock className="size-5 text-muted-foreground" strokeWidth={2} />
          </div>
        </div>
        <h1 className="text-xl font-medium text-foreground">{message}</h1>
        <div className="flex flex-col gap-3 items-center">
          {showResend && orderId && (
            <Link
              href={`/orders?oid=${orderId}`}
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground no-underline rounded-full font-medium hover:opacity-90 transition-opacity text-sm"
            >
              Request a new link →
            </Link>
          )}
          <Link
            href="/orders"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← My purchases
          </Link>
        </div>
      </div>
    </main>
  );
}
