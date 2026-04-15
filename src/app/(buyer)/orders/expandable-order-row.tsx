"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

type Order = {
  id: string;
  product_title: string;
  price_paid: number;
  currency: string;
  created_at: string;
  status: string;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ExpandableOrderRow({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const shortId = order.id.slice(0, 8).toUpperCase();

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-3.5 flex items-center gap-3 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {order.product_title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDate(order.created_at)} · ${order.price_paid.toFixed(2)}{" "}
            {order.currency.toUpperCase()}
          </p>
        </div>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border">
          <div className="pt-4 flex flex-col gap-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount paid</span>
              <span className="font-medium text-foreground">
                ${order.price_paid.toFixed(2)} {order.currency.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="text-foreground">{formatDate(order.created_at)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order</span>
              <span className="text-foreground font-mono text-xs">#{shortId}</span>
            </div>
          </div>
          <div className="mt-4">
            {order.status === "refunded" ? (
              <p className="text-center text-sm text-muted-foreground py-2">
                This order was refunded
              </p>
            ) : (
              <a
                href={`/api/orders/${order.id}/access`}
                className="flex items-center justify-center w-full px-6 py-3.5 bg-primary text-primary-foreground no-underline rounded-full font-medium text-base hover:opacity-90 transition-opacity"
              >
                Open link →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
