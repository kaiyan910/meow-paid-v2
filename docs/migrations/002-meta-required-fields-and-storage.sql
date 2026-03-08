-- Revision 2: Make shop and payment_subtype FK fields required,
-- make logo required, and create storage bucket for shop logos.
--
-- IMPORTANT: Also create a Supabase Storage bucket named "shop-logos"
-- (public, allowed mime types: image/*) via the Supabase dashboard.

-- shops: shop_category_id becomes NOT NULL, FK changes to ON DELETE RESTRICT
ALTER TABLE shops
  ALTER COLUMN shop_category_id SET NOT NULL;

ALTER TABLE shops
  DROP CONSTRAINT shops_shop_category_id_fkey,
  ADD CONSTRAINT shops_shop_category_id_fkey
    FOREIGN KEY (shop_category_id) REFERENCES shop_categories(id) ON DELETE RESTRICT;

-- shops: logo becomes NOT NULL (stored as Supabase Storage public URL)
ALTER TABLE shops
  ALTER COLUMN logo SET NOT NULL;

-- payment_subtypes: payment_type_id becomes NOT NULL, FK changes to ON DELETE RESTRICT
ALTER TABLE payment_subtypes
  ALTER COLUMN payment_type_id SET NOT NULL;

ALTER TABLE payment_subtypes
  DROP CONSTRAINT payment_subtypes_payment_type_id_fkey,
  ADD CONSTRAINT payment_subtypes_payment_type_id_fkey
    FOREIGN KEY (payment_type_id) REFERENCES payment_types(id) ON DELETE RESTRICT;
