-- Transactions and transaction items tables.
-- Run this in your Supabase SQL editor.

-- Transactions
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_date TIMESTAMPTZ NOT NULL,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
  payee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  price DOUBLE PRECISION NOT NULL,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD transactions"
  ON transactions FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Transaction items (payment breakdown)
CREATE TABLE transaction_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  payment_subtype_id UUID NOT NULL REFERENCES payment_subtypes(id) ON DELETE RESTRICT,
  price DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD transaction_items"
  ON transaction_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Index for querying transactions by month
CREATE INDEX idx_transactions_date ON transactions (transaction_date DESC);

-- Index for querying items by transaction
CREATE INDEX idx_transaction_items_transaction ON transaction_items (transaction_id);
