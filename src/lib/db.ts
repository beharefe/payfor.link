/** Single source of truth for all Supabase table names. Change here, not in 20 files. */
export const TABLES = {
  SELLERS: "sellers",
  PRODUCTS: "products",
  ORDERS: "orders",
  ACCESS_TOKENS: "access_tokens",
  REPORTS: "reports",
} as const;
