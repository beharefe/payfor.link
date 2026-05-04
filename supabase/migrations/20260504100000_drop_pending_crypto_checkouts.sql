-- pending_crypto_checkouts was used by the Helio webhook to match payments back to orders.
-- Helio has been replaced with direct Solana Pay + wallet adapter transfers.
-- Order creation now happens in /api/solana-confirm (wallet adapter) and /api/action-code-status (ACP).
-- Neither uses this table.
drop table if exists public.pending_crypto_checkouts;
