"use client";

import { resendAccess } from "@payforlink/app/actions/library";
import { useState } from "react";

type Purchase = {
  id: string;
  product_title: string;
  price_paid: number;
  currency: string;
  created_at: string;
};

export function LibraryList({ purchases }: { purchases: Purchase[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ id: string; text: string } | null>(null);

  async function handleReaccess(purchaseId: string) {
    setLoadingId(purchaseId);
    setMessage(null);
    const result = await resendAccess(purchaseId);
    setLoadingId(null);
    if ("error" in result) {
      setMessage({ id: purchaseId, text: result.error });
    } else {
      setMessage({ id: purchaseId, text: "Access link sent to your email." });
    }
  }

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {purchases.map((p) => (
        <li
          key={p.id}
          style={{
            padding: "1rem",
            border: "1px solid #eee",
            marginBottom: "0.5rem",
          }}
        >
          <strong>{p.product_title}</strong>
          <br />
          ${p.price_paid.toFixed(2)} {p.currency.toUpperCase()} —{" "}
          {new Date(p.created_at).toLocaleDateString()}
          <br />
          <button
            type="button"
            onClick={() => handleReaccess(p.id)}
            disabled={loadingId === p.id}
            style={{ marginTop: "0.5rem", padding: "0.25rem 0.5rem" }}
          >
            {loadingId === p.id ? "Sending…" : "Re-access"}
          </button>
          {message?.id === p.id && (
            <span style={{ marginLeft: "0.5rem", color: "green" }}>{message.text}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
