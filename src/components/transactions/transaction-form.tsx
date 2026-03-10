/**
 * TransactionForm — shared form component for creating and editing transactions.
 * Uses TanStack Form with Zod validation for type-safe form management.
 */
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PaymentItemRow } from "@/components/transactions/payment-item-row";
import { ShopAutocomplete } from "@/components/transactions/shop-autocomplete";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useProfiles } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import {
  type TransactionFormDefaults,
  transactionSchema,
} from "@/schemas/transaction.schema";
import moment from "moment";

interface TransactionFormProps {
  /** Form title translation key */
  titleKey: string;
  /** Submit button translation key */
  submitKey: string;
  /** Default form values */
  defaultValues: TransactionFormDefaults;
  /** Called with validated payload on submit */
  onSubmit: (payload: {
    transaction_date: string;
    shop_id: string;
    payee_id: string;
    remark: string | null;
    items: Array<{ payment_subtype_id: string; price: number }>;
  }) => Promise<void>;
  /** Whether the mutation is in progress */
  isPending: boolean;
}

const SELECT_CLASS =
  "flex h-10 w-full rounded-sm border-2 border-input bg-background px-3 py-2 text-sm font-retro ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function TransactionForm({
  titleKey,
  submitKey,
  defaultValues,
  onSubmit,
  isPending,
}: TransactionFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profiles = useProfiles();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      // Parse string prices to numbers and build the submission payload
      const parsedItems = value.items
        .map((item) => ({
          payment_subtype_id: item.payment_subtype_id,
          price: Number.parseFloat(item.price),
        }))
        .filter(
          (item) =>
            item.payment_subtype_id &&
            !Number.isNaN(item.price) &&
            item.price > 0,
        );

      const payload = {
        transaction_date: moment(value.transaction_date).toISOString(),
        shop_id: value.shop_id,
        payee_id: value.payee_id,
        remark: value.remark || null,
        items: parsedItems,
      };

      // Final Zod validation on the submission payload
      const parsed = transactionSchema.safeParse(payload);
      if (!parsed.success) return;

      await onSubmit(parsed.data);
      void navigate({ to: "/main/transactions" });
    },
  });

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-sm font-bold tracking-widest uppercase">
        {t(titleKey)}
      </h2>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        {/* Transaction Date */}
        <form.Field
          name="transaction_date"
          validators={{
            onSubmit: ({ value }) => {
              if (!value) return t("transactions.form.transactionDateRequired");
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest">
                {t("transactions.form.transactionDate")}
              </Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      SELECT_CLASS,
                      "items-center gap-2",
                      !field.state.value && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="size-4 shrink-0" />
                    <span>
                      {field.state.value
                        ? moment(field.state.value).format("YYYY-MM-DD")
                        : t("transactions.form.transactionDatePlaceholder")}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.state.value}
                    onSelect={(d) => {
                      field.handleChange(d as Date);
                      setCalendarOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
              {field.state.meta.errors.length > 0 && (
                <p className="text-xs text-destructive">
                  {field.state.meta.errors.join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Shop (autocomplete) */}
        <form.Field
          name="shop_id"
          validators={{
            onSubmit: ({ value }) => {
              if (!value) return t("transactions.form.shopRequired");
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest">
                {t("transactions.form.shop")}
              </Label>
              <ShopAutocomplete
                value={field.state.value}
                onChange={(v) => field.handleChange(v)}
                onBlur={field.handleBlur}
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-xs text-destructive">
                  {field.state.meta.errors.join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Payee */}
        <form.Field
          name="payee_id"
          validators={{
            onSubmit: ({ value }) => {
              if (!value) return t("transactions.form.payeeRequired");
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest">
                {t("transactions.form.payee")}
              </Label>
              <select
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={SELECT_CLASS}
              >
                <option value="">
                  {t("transactions.form.payeePlaceholder")}
                </option>
                {profiles.data?.map((p) => (
                  <option key={p.user_id} value={p.user_id}>
                    {p.display_name ?? p.user_id}
                  </option>
                ))}
              </select>
              {field.state.meta.errors.length > 0 && (
                <p className="text-xs text-destructive">
                  {field.state.meta.errors.join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Payment Details (array field) */}
        <form.Field name="items" mode="array">
          {(itemsField) => (
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest">
                {t("transactions.form.paymentDetails")}
              </Label>

              {itemsField.state.value.map((_, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: TanStack Form array fields are index-based
                <div key={`item-${index}`} className="space-y-1">
                  <form.Field name={`items[${index}].payment_subtype_id`}>
                    {(subtypeField) => (
                      <form.Field name={`items[${index}].price`}>
                        {(priceField) => (
                          <>
                            <PaymentItemRow
                              subtypeId={subtypeField.state.value}
                              price={priceField.state.value}
                              onSubtypeChange={(v) =>
                                subtypeField.handleChange(v)
                              }
                              onPriceChange={(v) => priceField.handleChange(v)}
                              onRemove={() => itemsField.removeValue(index)}
                              canRemove={itemsField.state.value.length > 1}
                            />
                            {subtypeField.state.meta.errors.length > 0 && (
                              <p className="text-xs text-destructive">
                                {subtypeField.state.meta.errors.join(", ")}
                              </p>
                            )}
                            {priceField.state.meta.errors.length > 0 && (
                              <p className="text-xs text-destructive">
                                {priceField.state.meta.errors.join(", ")}
                              </p>
                            )}
                          </>
                        )}
                      </form.Field>
                    )}
                  </form.Field>
                </div>
              ))}

              {itemsField.state.meta.errors.length > 0 && (
                <p className="text-xs text-destructive">
                  {itemsField.state.meta.errors.join(", ")}
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-2 text-xs tracking-widest uppercase"
                onClick={() =>
                  itemsField.pushValue({
                    payment_subtype_id: "",
                    price: "",
                  })
                }
              >
                <Plus className="mr-1 size-3" />
                {t("transactions.form.addItem")}
              </Button>
            </div>
          )}
        </form.Field>

        {/* Total */}
        <form.Subscribe selector={(state) => state.values.items}>
          {(items) => {
            const totalPrice = items.reduce((sum, item) => {
              const p = Number.parseFloat(item.price);
              return sum + (Number.isNaN(p) ? 0 : p);
            }, 0);
            return (
              <div className="flex items-center justify-between border-t-2 border-border pt-3">
                <span className="text-xs font-bold uppercase tracking-widest">
                  {t("transactions.form.totalPrice")}
                </span>
                <span className="text-sm font-bold text-destructive">
                  −${totalPrice.toFixed(2)}
                </span>
              </div>
            );
          }}
        </form.Subscribe>

        {/* Remark */}
        <form.Field
          name="remark"
          validators={{
            onSubmit: ({ value }) => {
              if (value && value.length > 100)
                return t("transactions.form.remarkMaxLength");
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest">
                {t("transactions.form.remark")}
              </Label>
              <Input
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t("transactions.form.remarkPlaceholder")}
                maxLength={100}
                className="border-2 font-retro"
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-xs text-destructive">
                  {field.state.meta.errors.join(", ")}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-2"
            onClick={() => void navigate({ to: "/main/transactions" })}
          >
            {t("transactions.form.cancel")}
          </Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!canSubmit || isPending}
                className="flex-1 border-2"
              >
                {(isPending || isSubmitting) && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {t(submitKey)}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
}

export { TransactionForm };
