"use client";

import * as amplitude from "@amplitude/unified";

if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY
) {
  amplitude.initAll(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY, {
    serverZone: "EU",
    analytics: { autocapture: true },
    sessionReplay: { sampleRate: 0 },
  });
}

// ---------------------------------------------------------------------------
// Typed event dictionary
// Add every event here before tracking it anywhere in the codebase.
// Convention: snake_case names, all properties required (use `?` sparingly).
// ---------------------------------------------------------------------------

export type AnalyticsEvent =
  // Buyer funnel
  | {
      name: "paywall_viewed";
      props: { link_id: string; slug: string; price: number; currency: string };
    }
  | {
      name: "checkout_started";
      props: { link_id: string; slug: string; price: number; currency: string };
    }
  | {
      name: "purchase_completed";
      props: {
        link_id: string;
        order_id: string;
        price: number;
        currency: string;
        platform_fee: number;
      };
    }
  | { name: "otp_verified"; props: { order_id: string } }
  | { name: "otp_resent"; props: { order_id: string } }
  | { name: "content_accessed"; props: { order_id: string; link_id: string } }
  // Seller funnel
  | { name: "seller_signed_up"; props: { user_id: string } }
  | { name: "stripe_connected"; props: { user_id: string } }
  | {
      name: "link_created";
      props: { link_id: string; price: number; product_type: string };
    }
  | { name: "link_published"; props: { link_id: string } }
  | { name: "link_archived"; props: { link_id: string } }
  | { name: "payout_requested"; props: { user_id: string } }
  // Marketing / acquisition
  | {
      name: "hero_variant_seen";
      props: { variant: string };
    }
  | {
      name: "cta_clicked";
      props: { location: string; label: string; variant?: string };
    }
  | {
      name: "blog_post_viewed";
      props: { slug: string; title: string };
    };

/**
 * Type-safe wrapper around amplitude.track().
 * Usage: track({ name: "paywall_viewed", props: { link_id, slug, price, currency } })
 */
export function track(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  amplitude.track(event.name, event.props);
}

/** Client component that boots Amplitude. Drop it inside <body> in the root layout. */
export function Amplitude() {
  return null;
}

export { amplitude };
export default amplitude;
