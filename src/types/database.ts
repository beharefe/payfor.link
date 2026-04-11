export type ProductStatus =
  | "draft"
  | "active"
  | "suspended"
  | "archived"
  | "deleted";
export type OrderStatus = "paid" | "refunded" | "disputed" | "fraud";
export type ProductType =
  | "template"
  | "file"
  | "access"
  | "service"
  | "dataset"
  | "other";
export type ReportReason = "scam" | "malware" | "copyright" | "other";
export type ReportStatus = "pending" | "reviewed" | "actioned" | "dismissed";

export interface Seller {
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

export interface Product {
  id: string;
  seller_id: string;
  slug: string;
  title: string;
  description: string | null;
  destination_url: string;
  price: number;
  currency: string;
  status: ProductStatus;
  version: number;
  product_type: ProductType | null;
  preview_image_url: string | null;
  cta_text: string | null;
  expires_at: string | null;
  max_orders: number | null;
  total_sales: number;
  total_revenue: number;
  reported_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  product_id: string;
  seller_id: string;
  buyer_email: string;
  buyer_email_verified: boolean;
  otp_hash: string | null;
  otp_expires_at: string | null;
  otp_attempts: number;
  stripe_payment_id: string;
  stripe_checkout_session_id: string | null;
  delivery_url: string;
  product_title: string;
  price_paid: number;
  platform_fee: number;
  currency: string;
  product_version: number;
  status: OrderStatus;
  refunded_at: string | null;
  refund_reason: string | null;
  stripe_refund_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessToken {
  id: string;
  order_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  product_id: string;
  reporter_email: string | null;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  created_at: string;
}
