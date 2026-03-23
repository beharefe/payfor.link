"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@unseallink/lib/supabase/client";

type NewOrder = { product_title: string; price_paid: number; currency: string };

export function SellerRealtimeNotifier({ sellerId }: { sellerId: string }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("seller-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "purchases",
          filter: `seller_id=eq.${sellerId}`,
        },
        (payload) => {
          const order = payload.new as NewOrder;
          const price = `$${order.price_paid.toFixed(2)} ${order.currency.toUpperCase()}`;
          setToast(`New order: ${order.product_title} — ${price}`);
          router.refresh();
          setTimeout(() => setToast(null), 6000);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sellerId, router]);

  if (!toast) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        background: "#111111",
        color: "#F5F4EF",
        padding: "0.75rem 1.25rem",
        borderRadius: "12px",
        fontSize: "0.95rem",
        fontWeight: 500,
        zIndex: 1000,
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      }}
    >
      🎉 {toast}
    </div>
  );
}
