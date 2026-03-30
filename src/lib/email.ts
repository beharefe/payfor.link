/**
 * Central email module — all outbound emails go through here.
 * Add a new function for every new email type; never call resend.emails.send directly.
 */

import { render } from "@react-email/render";
import { AccessLinkEmail } from "@unseallink/emails/access-link";
import { MagicLinkEmail } from "@unseallink/emails/magic-link";
import { MissedSaleEmail } from "@unseallink/emails/missed-sale";
import { SaleNotificationEmail } from "@unseallink/emails/sale-notification";
import { ACCESS_TOKEN_DAYS } from "./buyer-token";
import { FROM_EMAIL, resend } from "./resend";

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
    from: FROM_EMAIL,
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
    from: FROM_EMAIL,
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
    from: FROM_EMAIL,
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
    from: FROM_EMAIL,
    to: opts.to,
    subject: `Someone tried to buy "${opts.productTitle}" — connect Stripe to go live`,
    html: await render(
      MissedSaleEmail({
        sellerName: opts.sellerName,
        productTitle: opts.productTitle,
        dashboardUrl: opts.dashboardUrl,
      }),
    ),
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
    from: FROM_EMAIL,
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
