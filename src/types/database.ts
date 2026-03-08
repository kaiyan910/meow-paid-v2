/**
 * Row types for Supabase meta-data tables.
 * These mirror the database schema defined in docs/migrations/001-meta-tables.sql.
 */

export interface ShopCategoryRow {
  id: string;
  name: string;
  created_at: string;
}

export interface ShopRow {
  id: string;
  name: string;
  shop_category_id: string;
  logo: string;
  created_at: string;
}

export interface PaymentTypeRow {
  id: string;
  name: string;
  created_at: string;
}

export interface PaymentSubtypeRow {
  id: string;
  name: string;
  payment_type_id: string;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string | null;
  created_at: string;
}

export interface TransactionRow {
  id: string;
  transaction_date: string;
  shop_id: string;
  payee_id: string;
  price: number;
  remark: string | null;
  created_at: string;
}

export interface TransactionItemRow {
  id: string;
  transaction_id: string;
  payment_subtype_id: string;
  price: number;
  created_at: string;
}

/** Joined transaction with shop + items for list display. */
export interface TransactionWithDetails extends TransactionRow {
  shops: {
    name: string;
    logo: string;
    shop_categories: { name: string } | null;
  } | null;
  transaction_items: Array<
    TransactionItemRow & {
      payment_subtypes: { name: string } | null;
    }
  >;
}

/** Union of all meta row types, handy for generic list rendering. */
export type MetaRow =
  | ShopCategoryRow
  | ShopRow
  | PaymentTypeRow
  | PaymentSubtypeRow;
