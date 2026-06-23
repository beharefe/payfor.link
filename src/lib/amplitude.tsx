"use client";

import * as amplitude from "@amplitude/analytics-browser";

if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY
) {
  const key = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(() => {
      amplitude.init(key, { autocapture: true });
    });
  } else {
    setTimeout(() => {
      amplitude.init(key, { autocapture: true });
    }, 0);
  }
}

// ---------------------------------------------------------------------------
// Typed event dictionary — based on Amplitude taxonomy (2026-04-11)
// Event names match the Amplitude plan exactly (Title Case with spaces).
// Properties use snake_case.
// ---------------------------------------------------------------------------

export type AnalyticsEvent =
  // ── Buyer / recipient funnel ─────────────────────────────────────────────
  | {
      name: "Sealed Link Opened";
      props: {
        link_id: string;
        link_token_present: boolean;
        delivery_channel: string; // "direct" | "email" | "social" | "unknown"
        referrer_domain?: string;
        is_first_open_for_link?: boolean;
        attempt_number?: number;
      };
    }
  | {
      name: "Unlock Code Submitted";
      props: {
        link_id: string;
        unlock_method: "otp_email";
        code_length: number;
        attempt_number: number;
        is_autofilled?: boolean;
      };
    }
  | {
      name: "Unseal Succeeded";
      props: {
        link_id: string;
        unlock_method: "otp_email";
        attempt_number: number;
        time_to_unseal_ms?: number;
        content_type: string; // product_type: template | file | access | service | dataset | other
      };
    }
  | {
      name: "Unseal Failed";
      props: {
        link_id: string;
        unlock_method: "otp_email";
        failure_reason: string; // "invalid_code" | "expired_code" | "max_attempts" | "order_not_found"
        attempt_number: number;
        is_rate_limited: boolean;
      };
    }
  | {
      name: "Content Revealed";
      props: {
        link_id: string;
        order_id: string;
        content_type: string;
      };
    }
  // ── Checkout (unseal.link-specific, not in Amplitude plan) ───────────────
  | {
      name: "Checkout Started";
      props: { link_id: string; slug: string; price: number; currency: string };
    }
  | {
      name: "Purchase Completed";
      props: {
        link_id: string;
        order_id: string;
        price: number;
        currency: string;
        platform_fee: number;
      };
    }
  // ── Seller / link management ─────────────────────────────────────────────
  | {
      name: "Link Created";
      props: {
        link_id: string;
        content_type: string; // product_type
        unlock_method: "otp_email";
        price: number;
        currency: string;
      };
    }
  | {
      name: "Link Shared";
      props: {
        link_id: string;
        share_channel: string; // "copy_link" | "dashboard"
        is_copy_link: boolean;
      };
    }
  | {
      name: "Link Settings Updated";
      props: {
        link_id: string;
        changed_fields: string[]; // ["title", "price", "description", "destination_url", "preview_image"]
      };
    }
  | {
      name: "Link Revoked";
      props: {
        link_id: string;
        revoke_reason: string; // "archived_by_seller" | "suspended_by_platform"
      };
    }
  // ── Auth ─────────────────────────────────────────────────────────────────
  | {
      name: "Signup Completed";
      props: { user_id: string; signup_method: "magic_link" };
    }
  | {
      name: "Login Completed";
      props: { user_id: string; login_method: "magic_link" };
    }
  // ── Stripe (unseal.link-specific) ────────────────────────────────────────
  | { name: "Stripe Connected"; props: { user_id: string } }
  | { name: "Payout Requested"; props: { user_id: string } }
  // ── Errors ───────────────────────────────────────────────────────────────
  | {
      name: "Error Encountered";
      props: {
        error_category: string; // "checkout" | "otp" | "webhook" | "stripe" | "auth"
        error_message: string;
        error_context?: string;
        http_status_code?: number;
        link_id?: string;
        attempt_number?: number;
      };
    }
  // ── Marketing ────────────────────────────────────────────────────────────
  | {
      name: "CTA Clicked";
      props: { location: string; label: string };
    }
  | {
      name: "Blog Post Viewed";
      props: { slug: string; title: string };
    }
  // ── Discovery ────────────────────────────────────────────────────────────
  | {
      name: "Discover Page Viewed";
      props: {
        platform_filter: string | null; // null = all
        total_results: number;
      };
    }
  | {
      name: "Discover Product Clicked";
      props: {
        link_id: string;
        platform: string | null;
        price: number;
        position: number; // card index in grid
      };
    }
  | {
      name: "Link Submitted to Discover";
      props: {
        link_id: string;
        platform: string | null;
        risk_level: string | null;
        total_sales: number;
      };
    }
  | {
      name: "Link Discover Status Changed";
      props: {
        link_id: string;
        old_status: string | null;
        new_status: string; // "approved" | "rejected"
        changed_by: string; // "admin"
      };
    };

/**
 * Type-safe wrapper around amplitude.track().
 * Usage: track({ name: "Sealed Link Opened", props: { link_id, ... } })
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
