/** Single source of truth for all Supabase table names. Change here, not in 20 files. */
export const TABLES = {
  SELLERS: "sellers",
  PRODUCTS: "products",
  ORDERS: "orders",
  ACCESS_TOKENS: "access_tokens",
  REPORTS: "reports",
  PROMOTIONS: "promotions",
  SELLER_PROMOTIONS: "seller_promotions",
  PROMOTION_USAGE_LOG: "promotion_usage_log",
  SELLER_ATTESTATIONS: "seller_attestations",
} as const;
