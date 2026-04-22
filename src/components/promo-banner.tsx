"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function PromoBanner() {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    setDismissed(localStorage.getItem("promo_banner_dismissed") === "1");
  }, []);

  // null = hydrating (avoid flash), true = dismissed
  if (dismissed !== false) return null;

  function dismiss() {
    localStorage.setItem("promo_banner_dismissed", "1");
    setDismissed(true);
  }

  return (
    <div className="bg-emerald-600 text-white px-4 py-2.5 flex items-center justify-between gap-4">
      <p className="text-sm font-medium text-center flex-1">
        ⚡ Launch offer: 0% platform fee on your first $500 in sales.{" "}
        <Link
          href="/auth"
          className="underline font-semibold hover:no-underline whitespace-nowrap"
        >
          Claim your spot →
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity text-base leading-none"
      >
        ✕
      </button>
    </div>
  );
}
