/**
 * MetaFormDialog — create / edit dialog for any meta type.
 * Renders a TanStack Form whose fields adapt to the active MetaType.
 * Validates with Zod before submitting to Supabase via TanStack Query.
 *
 * Shop logo is uploaded to Supabase Storage; its public URL is stored in the DB.
 */
import { useForm } from "@tanstack/react-form";
import { ImagePlus, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  uploadShopLogo,
  useCreateMeta,
  usePaymentTypes,
  useShopCategories,
  useUpdateMeta,
} from "@/hooks/use-meta-queries";
import {
  paymentSubtypeSchema,
  paymentTypeSchema,
  shopCategorySchema,
  shopSchema,
} from "@/schemas/meta.schema";
import { META_TABLE, type MetaType } from "@/store/meta.store";

/** All possible form fields — only the relevant subset is rendered. */
interface MetaFormValues {
  name: string;
  shop_category_id: string;
  logo: string;
  payment_type_id: string;
}

interface MetaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metaType: MetaType;
  /** When non-null the dialog is in "edit" mode. */
  editItem: Record<string, unknown> | null;
}

const SCHEMA_MAP = {
  shop: shopSchema,
  shopCategory: shopCategorySchema,
  paymentType: paymentTypeSchema,
  paymentSubtype: paymentSubtypeSchema,
} as const;

/** Build default values from an optional existing item. */
function buildDefaults(
  editItem: Record<string, unknown> | null,
): MetaFormValues {
  return {
    name: (editItem?.name as string) ?? "",
    shop_category_id: (editItem?.shop_category_id as string) ?? "",
    logo: (editItem?.logo as string) ?? "",
    payment_type_id: (editItem?.payment_type_id as string) ?? "",
  };
}

/** Extract only the fields relevant to the given meta type. */
function extractFields(
  metaType: MetaType,
  values: MetaFormValues,
): Record<string, unknown> {
  switch (metaType) {
    case "shop":
      return {
        name: values.name,
        shop_category_id: values.shop_category_id,
        logo: values.logo,
      };
    case "shopCategory":
    case "paymentType":
      return { name: values.name };
    case "paymentSubtype":
      return {
        name: values.name,
        payment_type_id: values.payment_type_id,
      };
  }
}

const SELECT_CLASS =
  "flex h-10 w-full rounded-sm border-2 border-input bg-background px-3 py-2 text-sm font-retro ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function MetaFormDialog({
  open,
  onOpenChange,
  metaType,
  editItem,
}: MetaFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!editItem;

  const table = META_TABLE[metaType];
  const createMutation = useCreateMeta(table);
  const updateMutation = useUpdateMeta(table);

  // Related data for select drop-downs
  const shopCategories = useShopCategories();
  const paymentTypes = usePaymentTypes();

  // File upload state for shop logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues: buildDefaults(editItem),
    onSubmit: async ({ value }) => {
      const mutableValues = { ...value };

      // Upload logo file if a new one was selected
      if (metaType === "shop" && logoFile) {
        const url = await uploadShopLogo(logoFile);
        mutableValues.logo = url;
      }

      const schema = SCHEMA_MAP[metaType];
      const fields = extractFields(metaType, mutableValues);
      const parsed = schema.safeParse(fields);
      if (!parsed.success) return;

      if (isEdit && editItem?.id) {
        await updateMutation.mutateAsync({
          id: editItem.id as string,
          ...parsed.data,
        });
      } else {
        await createMutation.mutateAsync(parsed.data);
      }
      onOpenChange(false);
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  /** Derive a display name from a logo URL or file. */
  const logoDisplayName = logoFile
    ? logoFile.name
    : form.state.values.logo
      ? form.state.values.logo.split("/").pop()
      : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("meta.edit") : t("meta.create")}{" "}
            {t(`meta.tabs.${metaType}`)}
          </DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          {/* Name — common to all types */}
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => {
                if (!value) return t("meta.form.nameRequired");
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest">
                  {t("meta.form.name")}
                </Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={t("meta.form.namePlaceholder")}
                  className="border-2 font-retro"
                />
                {field.state.meta.errors.length > 0 &&
                  field.state.meta.isTouched && (
                    <p className="text-xs text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
              </div>
            )}
          </form.Field>

          {/* Shop-specific fields */}
          {metaType === "shop" && (
            <>
              {/* Shop category — required */}
              <form.Field
                name="shop_category_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return t("meta.form.shopCategoryRequired");
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-widest">
                      {t("meta.form.shopCategory")}
                    </Label>
                    <select
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className={SELECT_CLASS}
                    >
                      <option value="">
                        {t("meta.form.shopCategoryPlaceholder")}
                      </option>
                      {shopCategories.data?.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {field.state.meta.errors.length > 0 &&
                      field.state.meta.isTouched && (
                        <p className="text-xs text-destructive">
                          {field.state.meta.errors[0]}
                        </p>
                      )}
                  </div>
                )}
              </form.Field>

              {/* Logo — file upload, required */}
              <form.Field
                name="logo"
                validators={{
                  onChange: ({ value }) => {
                    if (!value && !logoFile) return t("meta.form.logoRequired");
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-widest">
                      {t("meta.form.logo")}
                    </Label>
                    {/* Hidden native file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setLogoFile(file);
                          // Set a placeholder so the validator knows a file exists
                          field.handleChange(file.name);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-10 w-full items-center gap-2 rounded-sm border-2 border-input bg-background px-3 text-sm font-retro text-muted-foreground transition-colors hover:border-primary/60"
                    >
                      <ImagePlus className="size-4 shrink-0" />
                      <span className="truncate">
                        {logoDisplayName || t("meta.form.logoPlaceholder")}
                      </span>
                    </button>
                    {field.state.meta.errors.length > 0 &&
                      field.state.meta.isTouched && (
                        <p className="text-xs text-destructive">
                          {field.state.meta.errors[0]}
                        </p>
                      )}
                  </div>
                )}
              </form.Field>
            </>
          )}

          {/* PaymentSubtype → payment_type select — required */}
          {metaType === "paymentSubtype" && (
            <form.Field
              name="payment_type_id"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return t("meta.form.paymentTypeRequired");
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest">
                    {t("meta.form.paymentType")}
                  </Label>
                  <select
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className={SELECT_CLASS}
                  >
                    <option value="">
                      {t("meta.form.paymentTypePlaceholder")}
                    </option>
                    {paymentTypes.data?.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name}
                      </option>
                    ))}
                  </select>
                  {field.state.meta.errors.length > 0 &&
                    field.state.meta.isTouched && (
                      <p className="text-xs text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                </div>
              )}
            </form.Field>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-2"
              onClick={() => onOpenChange(false)}
            >
              {t("meta.form.cancel")}
            </Button>
            <Button type="submit" disabled={isPending} className="border-2">
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("meta.form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { MetaFormDialog };
