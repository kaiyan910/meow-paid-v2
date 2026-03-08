/**
 * MetaTab — manages four types of application meta-data:
 *   商店 (Shop), 商店類型 (Shop Category),
 *   支出類型 (Payment Type), 支出子類型 (Payment Sub-type).
 *
 * Uses an inner tab bar to switch between types.
 * Each type displays a list, with create / edit / delete via dialogs.
 */
import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import i18n, { changeLanguage } from "@/i18n";

import { MetaFormDialog } from "@/components/meta/meta-form-dialog";
import { MetaList, type MetaListItem } from "@/components/meta/meta-list";
import { Button } from "@/components/ui/button";
import {
  useDeleteMeta,
  usePaymentSubtypes,
  usePaymentTypes,
  useShopCategories,
  useShops,
} from "@/hooks/use-meta-queries";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import {
  META_TABLE,
  META_TYPES,
  type MetaType,
  useMetaStore,
} from "@/store/meta.store";

/** Maps raw query data to a flat list of MetaListItem for display. */
function toListItems(
  metaType: MetaType,
  data: unknown[] | undefined,
): MetaListItem[] {
  if (!data) return [];

  return data.map((row: unknown) => {
    const r = row as Record<string, unknown>;
    const id = r.id as string;
    const name = r.name as string;

    switch (metaType) {
      case "shop": {
        const catObj = r.shop_categories as { name: string } | null;
        const logo = r.logo as string | undefined;
        return {
          id,
          title: name,
          subtitle: catObj?.name ?? undefined,
          image: logo || undefined,
        };
      }
      case "paymentSubtype": {
        const ptObj = r.payment_types as { name: string } | null;
        return {
          id,
          title: name,
          subtitle: ptObj?.name ?? undefined,
        };
      }
      default:
        return { id, title: name };
    }
  });
}

function MetaTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const {
    activeTab,
    setActiveTab,
    createDialogOpen,
    setCreateDialogOpen,
    editingItem,
    setEditingItem,
  } = useMetaStore();

  // Fetch all four meta lists
  const shops = useShops();
  const shopCategories = useShopCategories();
  const paymentTypes = usePaymentTypes();
  const paymentSubtypes = usePaymentSubtypes();

  const queryMap = {
    shop: shops,
    shopCategory: shopCategories,
    paymentType: paymentTypes,
    paymentSubtype: paymentSubtypes,
  } as const;

  const currentQuery = queryMap[activeTab];
  const items = toListItems(activeTab, currentQuery.data);

  // Delete
  const deleteMutation = useDeleteMeta(META_TABLE[activeTab]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  };

  // Edit — find the raw item from query data to populate the form
  const handleItemClick = (id: string) => {
    const raw = (
      currentQuery.data as Record<string, unknown>[] | undefined
    )?.find((r) => (r as Record<string, unknown>).id === id) as
      | Record<string, unknown>
      | undefined;
    if (raw) setEditingItem(raw);
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    void navigate({ to: "/" });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Inner tab bar */}
      <div className="flex shrink-0 border-b-2 border-border">
        {META_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveTab(type)}
            className={cn(
              "flex-1 py-2.5 text-[10px] uppercase tracking-widest transition-colors",
              activeTab === type
                ? "border-b-2 border-primary text-primary font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`meta.tabs.${type}`)}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4">
        <MetaList
          items={items}
          isLoading={currentQuery.isLoading}
          onItemClick={handleItemClick}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      </div>

      {/* Language & Logout */}
      <div className="shrink-0 space-y-2 border-t-2 border-border p-4">
        {/* Language selector */}
        <div className="space-y-1">
          <label
            htmlFor="language-select"
            className="text-[10px] uppercase tracking-widest text-muted-foreground"
          >
            {t("meta.language")}
          </label>
          <select
            id="language-select"
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="flex h-10 w-full rounded-sm border-2 border-input bg-background px-3 py-2 text-sm font-retro ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="en">English</option>
            <option value="zh">正體中文</option>
          </select>
        </div>

        <Button
          variant="outline"
          className="w-full border-2 tracking-widest uppercase shadow-[2px_2px_0px_0px] shadow-border/60 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          onClick={() => void handleLogout()}
        >
          <LogOut className="mr-2 size-4" />
          {t("meta.logout")}
        </Button>
      </div>

      {/* Create dialog — keyed by metaType to reset form on tab switch */}
      <MetaFormDialog
        key={`create-${activeTab}`}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        metaType={activeTab}
        editItem={null}
      />

      {/* Edit dialog — keyed by item id to reset form per item */}
      {editingItem && (
        <MetaFormDialog
          key={`edit-${editingItem.id}`}
          open={!!editingItem}
          onOpenChange={(open) => {
            if (!open) setEditingItem(null);
          }}
          metaType={activeTab}
          editItem={editingItem}
        />
      )}
    </div>
  );
}

export { MetaTab };
