/** Single source of truth for experimental feature flags gated by env vars. */
export const EXPERIMENTAL_CRYPTO_ENABLED =
  process.env.EXPERIMENTAL_CRYPTO_ENABLED === "true";
