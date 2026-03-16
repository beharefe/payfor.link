export type LinkStatus =
  | "draft"
  | "active"
  | "suspended"
  | "archived"
  | "deleted";
export type PurchaseStatus = "paid" | "refunded" | "disputed" | "fraud";
export type ProductType =
  | "template"
  | "file"
  | "access"
  | "service"
  | "dataset"
  | "other";
export type AbuseReportReason = "scam" | "malware" | "copyright" | "other";
export type AbuseReportStatus =
  | "pending"
  | "reviewed"
  | "actioned"
  | "dismissed";

export interface User {
  id: string;
  email: string;
  name: string | null;
  stripe_account_id: string | null;
  stripe_connected: boolean;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_details_submitted: boolean;
  total_earned: number;
  total_fees: number;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Link {
  id: string;
  seller_id: string;
  slug: string;
  title: string;
  description: string | null;
  destination_url: string;
  price: number;
  currency: string;
  status: LinkStatus;
  version: number;
  product_type: ProductType | null;
  preview_image_url: string | null;
  cta_text: string | null;
  expires_at: string | null;
  max_purchases: number | null;
  total_sales: number;
  total_revenue: number;
  reported_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  link_id: string;
  seller_id: string;
  buyer_email: string;
  buyer_email_verified: boolean;
  otp_code_hash: string | null;
  otp_expires_at: string | null;
  otp_attempts: number;
  stripe_payment_id: string;
  stripe_checkout_session_id: string | null;
  delivery_url: string;
  product_title: string;
  price_paid: number;
  platform_fee: number;
  currency: string;
  link_version: number;
  status: PurchaseStatus;
  refunded_at: string | null;
  refund_reason: string | null;
  stripe_refund_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnlockToken {
  id: string;
  purchase_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface AbuseReport {
  id: string;
  link_id: string;
  reporter_email: string | null;
  reason: AbuseReportReason;
  description: string | null;
  status: AbuseReportStatus;
  created_at: string;
}
