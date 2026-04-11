"use client";

import dynamic from "next/dynamic";

// Defer Amplitude until after hydration — keeps it out of the critical JS bundle
// so it doesn't block FCP/LCP on buyer-facing pages (paywall, orders, etc.)
const Amplitude = dynamic(
  () => import("@unseallink/lib/amplitude").then((m) => m.Amplitude),
  { ssr: false },
);

export function AnalyticsProvider() {
  return <Amplitude />;
}
