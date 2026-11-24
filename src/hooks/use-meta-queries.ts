import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { apiFetch } from "@/lib/api";
import {
  paymentSubtypeRowSchema,
  paymentTypeRowSchema,
  shopCategoryRowSchema,
  shopRowSchema,
} from "@/schemas/api.schema";

function useMetaList<T>(table: string, schema: z.ZodType<T>) {
  return useQuery({
    queryKey: ["meta", table],
    queryFn: () => apiFetch(`/api/meta/${table}`, schema.array()),
  });
}

function useCreateMeta(table: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch(`/api/meta/${table}`, z.null(), { method: "POST", body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meta", table] });
    },
  });
}

function useUpdateMeta(table: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      apiFetch(`/api/meta/${table}?id=${encodeURIComponent(id)}`, z.null(), {
        method: "PATCH",
        body,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meta", table] });
    },
  });
}

function useDeleteMeta(table: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/meta/${table}?id=${encodeURIComponent(id)}`, z.null(), {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meta", table] });
    },
  });
}

export function useShopCategories() {
  return useMetaList("shop_categories", shopCategoryRowSchema);
}

export function useShops() {
  return useMetaList("shops", shopRowSchema);
}

export function usePaymentTypes() {
  return useMetaList("payment_types", paymentTypeRowSchema);
}

export function usePaymentSubtypes() {
  return useMetaList("payment_subtypes", paymentSubtypeRowSchema);
}

/** Uploads a logo through the app and returns its same-origin display URL. */
export function uploadShopLogo(file: File) {
  const body = new FormData();
  body.set("file", file);
  return apiFetch("/api/shop-logos", z.string(), { method: "POST", body });
}

export { useCreateMeta, useDeleteMeta, useUpdateMeta };
