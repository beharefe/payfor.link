import { sendBuyerDisputeAlert } from "@unseallink/lib/email";
import { log } from "@unseallink/lib/logger";
import { NextResponse } from "next/server";

const VALID_ISSUES = [
  "I never received the email",
  "The link in my email doesn't work",
  "I was charged but payment shows as failed",
  "The content isn't what was described",
  "Other",
] as const;

type IssueType = (typeof VALID_ISSUES)[number];

function tag(issue: IssueType): "SUPPORT" | "ABUSE" {
  return issue === "The content isn't what was described" ? "ABUSE" : "SUPPORT";
}

export async function POST(request: Request) {
  let body: {
    buyer_email?: string;
    issue_type?: string;
    product_name?: string;
    seller_username?: string;
    amount_paid?: number;
    currency?: string;
    payment_intent_id?: string;
    order_id?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const {
    buyer_email,
    issue_type,
    product_name,
    seller_username,
    amount_paid,
    currency,
    payment_intent_id,
    order_id,
  } = body;

  if (!buyer_email || typeof buyer_email !== "string") {
    return NextResponse.json({ error: "Missing buyer_email" }, { status: 400 });
  }
  if (!issue_type || !VALID_ISSUES.includes(issue_type as IssueType)) {
    return NextResponse.json({ error: "Invalid issue_type" }, { status: 400 });
  }
  if (!product_name || !seller_username || !order_id || !payment_intent_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const issueType = issue_type as IssueType;

  sendBuyerDisputeAlert({
    buyerEmail: buyer_email.trim().toLowerCase(),
    issueType,
    productName: product_name,
    sellerUsername: seller_username,
    amountPaid: typeof amount_paid === "number" ? amount_paid : 0,
    currency: currency ?? "usd",
    paymentIntentId: payment_intent_id,
    orderId: order_id,
    tag: tag(issueType),
  }).catch((err) =>
    log.error("buyer_dispute_email_failed", { error: String(err) }),
  );

  return NextResponse.json({ ok: true });
}
