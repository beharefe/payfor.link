"use client";

import Link from "next/link";

type Purchase = {
  id: string;
  product_title: string;
  price_paid: number;
  currency: string;
  created_at: string;
};

export function LibraryList({ purchases }: { purchases: Purchase[] }) {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {purchases.map((p) => (
        <li
          key={p.id}
          style={{ padding: "1rem", border: "1px solid #eee", marginBottom: "0.5rem" }}
        >
          <strong>{p.product_title}</strong>
          <br />
          ${p.price_paid.toFixed(2)} {p.currency.toUpperCase()} —{" "}
          {new Date(p.created_at).toLocaleDateString()}
          <br />
          <Link
            href={`/delivery/${p.id}`}
            style={{ marginTop: "0.5rem", display: "inline-block" }}
          >
            Access →
          </Link>
        </li>
      ))}
    </ul>
  );
}
