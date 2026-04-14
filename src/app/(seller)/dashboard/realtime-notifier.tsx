"use client";

import { createClient } from "@unseallink/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

type NewOrder = { product_title: string; price_paid: number; currency: string };

export function SellerRealtimeNotifier({ sellerId }: { sellerId: string }) {
  const router = useRouter();

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
          toast.success(`New order: ${order.product_title}`, {
            description: price,
            duration: 6000,
          });
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sellerId, router]);

  return null;
}
