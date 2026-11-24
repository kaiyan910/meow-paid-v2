BEGIN;

ALTER TABLE public.shops ALTER COLUMN logo DROP NOT NULL;
ALTER TABLE public.transactions ADD COLUMN discount NUMERIC(14, 2) NOT NULL DEFAULT 0
  CHECK (discount >= 0 AND discount < 'Infinity'::NUMERIC);

-- Keep a confirmation scoped to the caller, even if the transaction is later deleted.
CREATE TABLE public.receipt_confirmations (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  draft_id UUID NOT NULL,
  transaction_id UUID UNIQUE REFERENCES public.transactions(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, draft_id)
);
ALTER TABLE public.receipt_confirmations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.receipt_confirmations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.receipt_confirmations TO authenticated;
CREATE POLICY "Read own receipt confirmations" ON public.receipt_confirmations
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Insert own receipt confirmations" ON public.receipt_confirmations
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

CREATE FUNCTION public.save_transaction_with_discount(
  p_id UUID, p_date TIMESTAMPTZ, p_shop_id UUID, p_payee_id UUID,
  p_remark TEXT, p_items JSONB, p_discount NUMERIC
) RETURNS UUID
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  saved_id UUID;
  subtotal NUMERIC;
  applied_discount NUMERIC;
BEGIN
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Payment items must be an array' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_items) = 0 OR EXISTS (
    SELECT 1 FROM jsonb_to_recordset(p_items) AS item(payment_subtype_id UUID, price DOUBLE PRECISION)
    WHERE item.payment_subtype_id IS NULL OR item.price IS NULL
      OR item.price <= 0 OR item.price >= 'Infinity'::DOUBLE PRECISION
  ) THEN
    RAISE EXCEPTION 'Payment items require a subtype and a positive, finite price' USING ERRCODE = '22023';
  END IF;

  SELECT SUM(item.price::NUMERIC) INTO subtotal
  FROM jsonb_to_recordset(p_items) AS item(price DOUBLE PRECISION);

  applied_discount := p_discount;
  IF p_id IS NOT NULL AND p_discount IS NULL THEN
    SELECT discount INTO applied_discount FROM public.transactions WHERE id = p_id FOR UPDATE;
  END IF;
  applied_discount := COALESCE(applied_discount, 0);
  IF applied_discount < 0 OR applied_discount > subtotal OR applied_discount <> ROUND(applied_discount, 2) THEN
    RAISE EXCEPTION 'Transaction discount must be a valid amount within the subtotal' USING ERRCODE = '22023';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.transactions (transaction_date, shop_id, payee_id, price, remark, discount)
    VALUES (p_date, p_shop_id, p_payee_id, subtotal - applied_discount, p_remark, applied_discount)
    RETURNING id INTO saved_id;
  ELSE
    UPDATE public.transactions
    SET transaction_date = p_date, shop_id = p_shop_id, payee_id = p_payee_id,
        price = subtotal - applied_discount, remark = p_remark, discount = applied_discount
    WHERE id = p_id RETURNING id INTO saved_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Transaction not found' USING ERRCODE = 'P0002';
    END IF;
    DELETE FROM public.transaction_items WHERE transaction_id = saved_id;
  END IF;

  INSERT INTO public.transaction_items (transaction_id, payment_subtype_id, price)
  SELECT saved_id, item.payment_subtype_id, item.price
  FROM jsonb_to_recordset(p_items) AS item(payment_subtype_id UUID, price DOUBLE PRECISION);
  RETURN saved_id;
END;
$$;

-- Preserve the original RPC contract for existing clients.
CREATE OR REPLACE FUNCTION public.save_transaction_with_items(
  p_id UUID, p_date TIMESTAMPTZ, p_shop_id UUID, p_payee_id UUID, p_remark TEXT, p_items JSONB
) RETURNS UUID
LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$
  SELECT public.save_transaction_with_discount(p_id, p_date, p_shop_id, p_payee_id, p_remark, p_items, NULL);
$$;

CREATE FUNCTION public.confirm_receipt_transaction(
  p_draft_id UUID, p_date TIMESTAMPTZ, p_shop_id UUID, p_shop_name TEXT,
  p_shop_category_id UUID, p_payee_id UUID, p_items JSONB, p_discount NUMERIC, p_paid_total NUMERIC
) RETURNS UUID
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  caller_id UUID := auth.uid();
  saved_id UUID;
  shop_id UUID := p_shop_id;
  saved_total NUMERIC;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Sign-in required' USING ERRCODE = '42501';
  END IF;
  IF p_draft_id IS NULL THEN
    RAISE EXCEPTION 'Draft ID required' USING ERRCODE = '22023';
  END IF;

  -- Serialize the lookup and write for retrying the same draft.
  PERFORM pg_advisory_xact_lock(hashtextextended(caller_id::TEXT || ':' || p_draft_id::TEXT, 0));
  SELECT transaction_id INTO saved_id FROM public.receipt_confirmations
  WHERE user_id = caller_id AND draft_id = p_draft_id;
  IF FOUND THEN
    IF saved_id IS NULL THEN
      RAISE EXCEPTION 'Transaction was deleted' USING ERRCODE = 'P0002';
    END IF;
    RETURN saved_id;
  END IF;

  IF p_payee_id IS DISTINCT FROM caller_id AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = p_payee_id
  ) THEN
    RAISE EXCEPTION 'Payee unavailable' USING ERRCODE = '42501';
  END IF;

  IF shop_id IS NULL THEN
    IF p_shop_name IS NULL OR char_length(btrim(p_shop_name)) NOT BETWEEN 1 AND 120 OR p_shop_category_id IS NULL THEN
      RAISE EXCEPTION 'Shop name and category required' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.shops (name, shop_category_id)
    VALUES (btrim(p_shop_name), p_shop_category_id) RETURNING id INTO shop_id;
  END IF;

  saved_id := public.save_transaction_with_discount(NULL, p_date, shop_id, p_payee_id, NULL, p_items, p_discount);
  SELECT price::NUMERIC INTO saved_total FROM public.transactions WHERE id = saved_id;
  IF saved_total IS DISTINCT FROM p_paid_total THEN
    RAISE EXCEPTION 'Receipt total does not reconcile' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.receipt_confirmations (user_id, draft_id, transaction_id)
  VALUES (caller_id, p_draft_id, saved_id);
  RETURN saved_id;
END;
$$;

-- Category reports continue to use transaction items. Overall spending uses the net price.
CREATE FUNCTION public.get_monthly_spending_total(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS DOUBLE PRECISION
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT COALESCE(SUM(price), 0) FROM public.transactions
  WHERE transaction_date >= start_date AND transaction_date <= end_date;
$$;

CREATE FUNCTION public.get_payee_spending_totals(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS TABLE (payee_id UUID, total DOUBLE PRECISION)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT t.payee_id, SUM(t.price) FROM public.transactions t
  WHERE t.transaction_date >= start_date AND transaction_date <= end_date
  GROUP BY t.payee_id;
$$;

REVOKE EXECUTE ON FUNCTION
  public.save_transaction_with_discount(UUID, TIMESTAMPTZ, UUID, UUID, TEXT, JSONB, NUMERIC),
  public.confirm_receipt_transaction(UUID, TIMESTAMPTZ, UUID, TEXT, UUID, UUID, JSONB, NUMERIC, NUMERIC),
  public.get_monthly_spending_total(TIMESTAMPTZ, TIMESTAMPTZ),
  public.get_payee_spending_totals(TIMESTAMPTZ, TIMESTAMPTZ)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.save_transaction_with_discount(UUID, TIMESTAMPTZ, UUID, UUID, TEXT, JSONB, NUMERIC),
  public.confirm_receipt_transaction(UUID, TIMESTAMPTZ, UUID, TEXT, UUID, UUID, JSONB, NUMERIC, NUMERIC),
  public.get_monthly_spending_total(TIMESTAMPTZ, TIMESTAMPTZ),
  public.get_payee_spending_totals(TIMESTAMPTZ, TIMESTAMPTZ)
  TO authenticated;

COMMIT;
