-- Meta-data tables for Explorer application.
-- Run this in your Supabase SQL editor to create the required tables.
-- All rows are shared among authenticated users (no per-user ownership).

-- Shop categories
CREATE TABLE shop_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shop_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD shop_categories"
  ON shop_categories FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Shops
CREATE TABLE shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  shop_category_id UUID REFERENCES shop_categories(id) ON DELETE SET NULL,
  logo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD shops"
  ON shops FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Payment types
CREATE TABLE payment_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payment_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD payment_types"
  ON payment_types FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Payment subtypes
CREATE TABLE payment_subtypes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  payment_type_id UUID REFERENCES payment_types(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payment_subtypes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD payment_subtypes"
  ON payment_subtypes FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
