import { Resend } from "resend";

export const resend = new Resend(
  process.env.RESEND_API_KEY ?? "re_build_placeholder",
);

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "noreply@unseal.link";

export const FROM = `unseal.link <${FROM_EMAIL}>`;

// Founder reply-to address — replies on welcome emails go to a human inbox.
// Set RESEND_FOUNDER_EMAIL in env (e.g. efe@unseal.link). Falls back to FROM_EMAIL.
export const FOUNDER_EMAIL =
  process.env.RESEND_FOUNDER_EMAIL ?? FROM_EMAIL;
