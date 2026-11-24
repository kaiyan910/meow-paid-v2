-- Save a transaction and its payment items together under the caller's RLS policies.
BEGIN;

CREATE OR REPLACE FUNCTION public.save_transaction_with_items(
  p_id UUID,
  p_date TIMESTAMPTZ,
  p_shop_id UUID,
  p_payee_id UUID,
  p_remark TEXT,
  p_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  saved_id UUID;
  total DOUBLE PRECISION;
BEGIN
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Payment items must be an array' USING ERRCODE = '22023';
  END IF;

  IF jsonb_array_length(p_items) = 0 OR EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_items) AS item(payment_subtype_id UUID, price DOUBLE PRECISION)
    WHERE item.payment_subtype_id IS NULL OR item.price IS NULL
      OR item.price <= 0 OR item.price >= 'Infinity'::DOUBLE PRECISION
  ) THEN
    RAISE EXCEPTION 'Payment items require a subtype and a positive, finite price'
      USING ERRCODE = '22023';
  END IF;

  SELECT SUM(item.price) INTO total
  FROM jsonb_to_recordset(p_items) AS item(price DOUBLE PRECISION);

  IF p_id IS NULL THEN
    INSERT INTO public.transactions (transaction_date, shop_id, payee_id, price, remark)
    VALUES (p_date, p_shop_id, p_payee_id, total, p_remark)
    RETURNING id INTO saved_id;
  ELSE
    UPDATE public.transactions
    SET transaction_date = p_date, shop_id = p_shop_id, payee_id = p_payee_id,
        price = total, remark = p_remark
    WHERE id = p_id
    RETURNING id INTO saved_id;

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

REVOKE EXECUTE ON FUNCTION public.save_transaction_with_items(UUID, TIMESTAMPTZ, UUID, UUID, TEXT, JSONB)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_transaction_with_items(UUID, TIMESTAMPTZ, UUID, UUID, TEXT, JSONB)
  TO authenticated;

COMMIT;
