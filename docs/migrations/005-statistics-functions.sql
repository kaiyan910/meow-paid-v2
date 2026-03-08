-- Database functions for statistics queries

-- Get total expenses and category (payment subtype) breakdown for a given month
CREATE OR REPLACE FUNCTION get_monthly_stats(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  payment_subtype_id UUID,
  payment_subtype_name TEXT,
  payment_type_id UUID,
  payment_type_name TEXT,
  total DOUBLE PRECISION
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ps.id AS payment_subtype_id,
    ps.name AS payment_subtype_name,
    pt.id AS payment_type_id,
    pt.name AS payment_type_name,
    COALESCE(SUM(ti.price), 0) AS total
  FROM transaction_items ti
  JOIN transactions t ON t.id = ti.transaction_id
  JOIN payment_subtypes ps ON ps.id = ti.payment_subtype_id
  JOIN payment_types pt ON pt.id = ps.payment_type_id
  WHERE t.transaction_date >= start_date
    AND t.transaction_date <= end_date
  GROUP BY ps.id, ps.name, pt.id, pt.name
  ORDER BY total DESC;
$$;

-- Get monthly totals for last N months, optionally filtered by payment type/subtype.
-- Always returns all N months; months with no matching data show 0.
CREATE OR REPLACE FUNCTION get_monthly_totals(
  end_date TIMESTAMPTZ,
  num_months INT DEFAULT 6,
  p_payment_type_id UUID DEFAULT NULL,
  p_payment_subtype_id UUID DEFAULT NULL
)
RETURNS TABLE (
  month_start DATE,
  total DOUBLE PRECISION
)
LANGUAGE sql STABLE
AS $$
  WITH months AS (
    SELECT generate_series(
      date_trunc('month', end_date) - ((num_months - 1) || ' months')::interval,
      date_trunc('month', end_date),
      '1 month'::interval
    )::date AS month_start
  ),
  filtered_items AS (
    SELECT
      date_trunc('month', t.transaction_date)::date AS tx_month,
      ti.price
    FROM transaction_items ti
    JOIN transactions t ON t.id = ti.transaction_id
    JOIN payment_subtypes ps ON ps.id = ti.payment_subtype_id
    WHERE (p_payment_type_id IS NULL OR ps.payment_type_id = p_payment_type_id)
      AND (p_payment_subtype_id IS NULL OR ti.payment_subtype_id = p_payment_subtype_id)
  )
  SELECT
    m.month_start,
    COALESCE(SUM(fi.price), 0) AS total
  FROM months m
  LEFT JOIN filtered_items fi ON fi.tx_month = m.month_start
  GROUP BY m.month_start
  ORDER BY m.month_start;
$$;
