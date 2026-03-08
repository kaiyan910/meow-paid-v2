/**
 * Meta UI store — tracks the active meta sub-tab and dialog state.
 * Shared between MetaTab (consumer) and MainPage header button (trigger).
 */
import { create } from "zustand";

export type MetaType =
  | "shop"
  | "shopCategory"
  | "paymentType"
  | "paymentSubtype";

export const META_TYPES: MetaType[] = [
  "shop",
  "shopCategory",
  "paymentType",
  "paymentSubtype",
];

/** Maps MetaType to the Supabase table name. */
export const META_TABLE: Record<MetaType, string> = {
  shop: "shops",
  shopCategory: "shop_categories",
  paymentType: "payment_types",
  paymentSubtype: "payment_subtypes",
};

interface MetaUIState {
  activeTab: MetaType;
  setActiveTab: (tab: MetaType) => void;
  createDialogOpen: boolean;
  setCreateDialogOpen: (open: boolean) => void;
  editingItem: Record<string, unknown> | null;
  setEditingItem: (item: Record<string, unknown> | null) => void;
}

export const useMetaStore = create<MetaUIState>((set) => ({
  activeTab: "shop",
  setActiveTab: (activeTab) => set({ activeTab }),
  createDialogOpen: false,
  setCreateDialogOpen: (createDialogOpen) => set({ createDialogOpen }),
  editingItem: null,
  setEditingItem: (editingItem) => set({ editingItem }),
}));
