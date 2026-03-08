/**
 * TanStack Query hooks for meta-data CRUD.
 * Provides generic list / create / update / delete hooks
 * plus type-specific wrappers with correct select queries.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type {
  PaymentSubtypeRow,
  PaymentTypeRow,
  ShopCategoryRow,
  ShopRow,
} from "@/types/database";

/* ------------------------------------------------------------------ */
/*  Generic CRUD hooks                                                */
/* ------------------------------------------------------------------ */

function useMetaList<T>(table: string, selectQuery = "*") {
  return useQuery({
    queryKey: ["meta", table],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select(selectQuery)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as T[];
    },
  });
}

function useCreateMeta(table: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from(table)
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meta", table] });
    },
  });
}

function useUpdateMeta(table: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...values
    }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase
        .from(table)
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meta", table] });
    },
  });
}

function useDeleteMeta(table: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meta", table] });
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Type-specific wrappers                                            */
/* ------------------------------------------------------------------ */

export function useShopCategories() {
  return useMetaList<ShopCategoryRow>("shop_categories");
}

/** Shops with the joined shop_category name. */
export function useShops() {
  return useMetaList<ShopRow & { shop_categories: { name: string } | null }>(
    "shops",
    "*, shop_categories(name)",
  );
}

export function usePaymentTypes() {
  return useMetaList<PaymentTypeRow>("payment_types");
}

/** Payment subtypes with the joined payment_type name. */
export function usePaymentSubtypes() {
  return useMetaList<
    PaymentSubtypeRow & { payment_types: { name: string } | null }
  >("payment_subtypes", "*, payment_types(name)");
}

/**
 * Uploads a logo file to the "shop-logos" Supabase Storage bucket.
 * Returns the public URL of the uploaded file.
 */
export async function uploadShopLogo(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "png";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const { data, error } = await supabase.storage
    .from("shop-logos")
    .upload(fileName, file);
  if (error) throw error;
  const {
    data: { publicUrl },
  } = supabase.storage.from("shop-logos").getPublicUrl(data.path);
  return publicUrl;
}

export { useCreateMeta, useDeleteMeta, useUpdateMeta };
