"use client";

import { createClient } from "@unseallink/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
    <div className="fixed bottom-8 right-8 bg-primary text-primary-foreground px-5 py-3 rounded-xl text-[0.95rem] font-medium z-[1000] shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
      🎉 {toast}
    </div>
  );
}
