-- ============================================================
-- MAX ORDERS ENFORCEMENT
-- ============================================================
-- Replaces the fire-and-forget increment_product_stats with an atomic
-- version that enforces max_orders at the DB level.
--
-- WHY: Two concurrent Stripe webhooks for a max_orders=1 product could
-- both pass the application-level check (total_sales < max_orders) before
-- either increments the counter, resulting in both buyers receiving the link.
--
-- HOW: A single UPDATE statement with a WHERE clause is atomic under
-- Postgres row-level locking. Only one concurrent caller can satisfy
-- total_sales < max_orders and increment the counter. The other gets
-- 0 rows updated (returns false) and the webhook issues an auto-refund.
--
-- Backward-compatible: when max_orders IS NULL, the condition is always
-- true, so unlimited products behave exactly as before.
-- ============================================================

CREATE OR REPLACE FUNCTION try_increment_product_stats(
  p_product_id uuid,
  p_revenue    numeric
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rows_updated integer;
BEGIN
  UPDATE products
  SET
    total_sales   = total_sales + 1,
    total_revenue = total_revenue + p_revenue
  WHERE
    id = p_product_id
    AND (max_orders IS NULL OR total_sales < max_orders);

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;
