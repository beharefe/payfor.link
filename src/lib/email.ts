/**
 * Central email module — all outbound emails go through here.
 * Add a new function for every new email type; never call resend.emails.send directly.
 */

import { render } from "@react-email/render";
import { AbuseReportAlert } from "@unseallink/emails/abuse-report-alert";
import { AccessLinkEmail } from "@unseallink/emails/access-link";
import { DisputeAlert } from "@unseallink/emails/dispute-alert";
import { MagicLinkEmail } from "@unseallink/emails/magic-link";
import { MissedSaleEmail } from "@unseallink/emails/missed-sale";
import { RefundBuyerEmail } from "@unseallink/emails/refund-buyer";
import { RefundSellerEmail } from "@unseallink/emails/refund-seller";
import { SaleNotificationEmail } from "@unseallink/emails/sale-notification";
import { ACCESS_TOKEN_DAYS } from "./buyer-token";
import { FROM, resend } from "./resend";

// Supabase magic link expiry is configured in the Supabase dashboard (Auth → Email → OTP Expiry).
// Keep this in sync with that setting.
const SELLER_LINK_EXPIRY = "1 hour";

/** Purchase confirmation — sent to buyer immediately after payment. */
export async function sendBuyerAccessEmail(opts: {
  to: string;
  accessLink: string;
  productTitle: string;
  orderUrl: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Your access link: ${opts.productTitle}`,
    html: await render(
      AccessLinkEmail({
        unlockUrl: opts.accessLink,
        productTitle: opts.productTitle,
      }),
    ),
  });
}

/** Orders sign-in link — sent when buyer requests access to their orders list. */
export async function sendBuyerSignInEmail(opts: {
  to: string;
  link: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: "Your orders sign-in link",
    html: await render(
      MagicLinkEmail({
        link: opts.link,
        expiresIn: `${ACCESS_TOKEN_DAYS} days`,
      }),
    ),
  });
}

/** Seller dashboard sign-in link — wraps the Supabase magic link in our template. */
export async function sendSellerSignInEmail(opts: {
  to: string;
  link: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: "Sign in to unseal.link",
    html: await render(
      MagicLinkEmail({
        link: opts.link,
        heading: "Sign in to unseal.link",
        body: "Click below to sign in to your seller dashboard. No password needed.",
        cta: "Sign in to dashboard →",
        expiresIn: SELLER_LINK_EXPIRY,
      }),
    ),
  });
}

/** Missed sale — sent to seller when a buyer visits a draft/inactive link. */
export async function sendMissedSaleEmail(opts: {
  to: string;
  sellerName: string;
  productTitle: string;
  dashboardUrl: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Someone tried to buy "${opts.productTitle}": connect Stripe to go live`,
    html: await render(
      MissedSaleEmail({
        sellerName: opts.sellerName,
        productTitle: opts.productTitle,
        dashboardUrl: opts.dashboardUrl,
      }),
    ),
  });
}

/** Abuse report alert — sent to info@unseal.link when a buyer submits a report. */
export async function sendAbuseReportAlert(opts: {
  productId: string;
  productTitle?: string;
  reason: string;
  description?: string | null;
  reporterEmail?: string | null;
  orderId?: string | null;
}) {
  return resend.emails.send({
    from: FROM,
    to: "info@unseal.link",
    subject: `[Report] ${opts.reason}: ${opts.productTitle ?? opts.productId}`,
    html: await render(AbuseReportAlert(opts)),
  });
}

/** Refund confirmation — sent to buyer when a refund is issued. */
export async function sendRefundBuyerEmail(opts: {
  to: string;
  productTitle: string;
  pricePaid: number;
  currency: string;
  orderId: string;
  sellerName?: string | null;
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Refund confirmed: ${opts.productTitle}`,
    html: await render(RefundBuyerEmail(opts)),
  });
}

/** Refund notification — sent to seller when they issue a refund. */
export async function sendRefundSellerEmail(opts: {
  to: string;
  sellerName: string;
  productTitle: string;
  pricePaid: number;
  platformFee: number;
  currency: string;
  buyerEmail: string;
  orderId: string;
  note?: string | null;
  dashboardUrl: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Refund issued: ${opts.productTitle}`,
    html: await render(RefundSellerEmail(opts)),
  });
}

/** Dispute alert — sent to admin and seller when a chargeback is opened. */
export async function sendDisputeAlert(opts: {
  to: string;
  orderId: string;
  productTitle: string;
  buyerEmail: string;
  amount: number;
  currency: string;
  reason: string;
  evidenceDueBy?: number | null;
  sellerEmail?: string | null;
  isSellerCopy?: boolean;
  sellerName?: string | null;
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `[Dispute] ${opts.productTitle} · $${opts.amount.toFixed(2)}: respond before deadline`,
    html: await render(DisputeAlert(opts)),
  });
}

/** Sale notification — sent to seller on every completed purchase. */
export async function sendSaleNotificationEmail(opts: {
  to: string;
  sellerName: string;
  productTitle: string;
  pricePaid: number;
  platformFee: number;
  dashboardUrl: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `New sale: ${opts.productTitle}`,
    html: await render(
      SaleNotificationEmail({
        sellerName: opts.sellerName,
        productTitle: opts.productTitle,
        pricePaid: opts.pricePaid,
        platformFee: opts.platformFee,
        dashboardUrl: opts.dashboardUrl,
      }),
    ),
  });
}
