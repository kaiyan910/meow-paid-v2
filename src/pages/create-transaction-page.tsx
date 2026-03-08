/**
 * CreateTransactionPage — form to create a new transaction.
 * Includes date picker, shop autocomplete, payee dropdown,
 * dynamic payment detail rows, and a remark field.
 */
import { useNavigate } from "@tanstack/react-router";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
import { useCallback, useState } from "react";
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
import { useCreateTransaction } from "@/hooks/use-transactions";
import { cn } from "@/lib/utils";
import { transactionSchema } from "@/schemas/transaction.schema";
import moment from "moment";

interface PaymentItemState {
  key: number;
  payment_subtype_id: string;
  price: string;
}

let nextKey = 1;

function CreateTransactionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profiles = useProfiles();
  const createMutation = useCreateTransaction();

  // Form state
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [shopId, setShopId] = useState("");
  const [payeeId, setPayeeId] = useState("");
  const [remark, setRemark] = useState("");
  const [items, setItems] = useState<PaymentItemState[]>([
    { key: nextKey++, payment_subtype_id: "", price: "" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calendarOpen, setCalendarOpen] = useState(false);

  const totalPrice = items.reduce((sum, item) => {
    const p = Number.parseFloat(item.price);
    return sum + (Number.isNaN(p) ? 0 : p);
  }, 0);

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { key: nextKey++, payment_subtype_id: "", price: "" },
    ]);
  }, []);

  const removeItem = useCallback((key: number) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const updateItem = useCallback(
    (key: number, field: "payment_subtype_id" | "price", value: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.key === key ? { ...item, [field]: value } : item,
        ),
      );
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};

    if (!date) {
      newErrors.date = t("transactions.form.transactionDateRequired");
    }
    if (!shopId) {
      newErrors.shop = t("transactions.form.shopRequired");
    }
    if (!payeeId) {
      newErrors.payee = t("transactions.form.payeeRequired");
    }
    if (remark.length > 100) {
      newErrors.remark = t("transactions.form.remarkMaxLength");
    }

    // Validate items
    const parsedItems: Array<{ payment_subtype_id: string; price: number }> =
      [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.payment_subtype_id) {
        newErrors[`item_${i}_subtype`] = t(
          "transactions.form.paymentSubtypeRequired",
        );
      }
      const price = Number.parseFloat(item.price);
      if (Number.isNaN(price) || price <= 0) {
        newErrors[`item_${i}_price`] = t("transactions.form.priceRequired");
      }
      if (item.payment_subtype_id && !Number.isNaN(price) && price > 0) {
        parsedItems.push({
          payment_subtype_id: item.payment_subtype_id,
          price,
        });
      }
    }

    if (
      parsedItems.length === 0 &&
      !newErrors.item_0_subtype &&
      !newErrors.item_0_price
    ) {
      newErrors.items = t("transactions.form.atLeastOneItem");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Final Zod validation
    const payload = {
      transaction_date: moment(date).toISOString(),
      shop_id: shopId,
      payee_id: payeeId,
      remark: remark || null,
      items: parsedItems,
    };

    const parsed = transactionSchema.safeParse(payload);
    if (!parsed.success) return;

    await createMutation.mutateAsync(parsed.data);
    void navigate({ to: "/main/transactions" });
  };

  const SELECT_CLASS =
    "flex h-10 w-full rounded-sm border-2 border-input bg-background px-3 py-2 text-sm font-retro ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-sm font-bold tracking-widest uppercase">
        {t("transactions.form.title")}
      </h2>

      <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        {/* Transaction Date */}
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
                  !date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="size-4 shrink-0" />
                <span>
                  {date
                    ? moment(date).format("YYYY-MM-DD")
                    : t("transactions.form.transactionDatePlaceholder")}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setCalendarOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
          {errors.date && (
            <p className="text-xs text-destructive">{errors.date}</p>
          )}
        </div>

        {/* Shop (autocomplete) */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-widest">
            {t("transactions.form.shop")}
          </Label>
          <ShopAutocomplete
            value={shopId}
            onChange={setShopId}
            onBlur={() => {}}
          />
          {errors.shop && (
            <p className="text-xs text-destructive">{errors.shop}</p>
          )}
        </div>

        {/* Payee */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-widest">
            {t("transactions.form.payee")}
          </Label>
          <select
            value={payeeId}
            onChange={(e) => setPayeeId(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">{t("transactions.form.payeePlaceholder")}</option>
            {profiles.data?.map((p) => (
              <option key={p.user_id} value={p.user_id}>
                {p.display_name ?? p.user_id}
              </option>
            ))}
          </select>
          {errors.payee && (
            <p className="text-xs text-destructive">{errors.payee}</p>
          )}
        </div>

        {/* Payment Details */}
        <div className="space-y-2">
          <Label className="text-[10px] uppercase tracking-widest">
            {t("transactions.form.paymentDetails")}
          </Label>
          {items.map((item, index) => (
            <div key={item.key} className="space-y-1">
              <PaymentItemRow
                subtypeId={item.payment_subtype_id}
                price={item.price}
                onSubtypeChange={(v) =>
                  updateItem(item.key, "payment_subtype_id", v)
                }
                onPriceChange={(v) => updateItem(item.key, "price", v)}
                onRemove={() => removeItem(item.key)}
                canRemove={items.length > 1}
              />
              {errors[`item_${index}_subtype`] && (
                <p className="text-xs text-destructive">
                  {errors[`item_${index}_subtype`]}
                </p>
              )}
              {errors[`item_${index}_price`] && (
                <p className="text-xs text-destructive">
                  {errors[`item_${index}_price`]}
                </p>
              )}
            </div>
          ))}
          {errors.items && (
            <p className="text-xs text-destructive">{errors.items}</p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-2 text-xs tracking-widest uppercase"
            onClick={addItem}
          >
            <Plus className="mr-1 size-3" />
            {t("transactions.form.addItem")}
          </Button>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between border-t-2 border-border pt-3">
          <span className="text-xs font-bold uppercase tracking-widest">
            {t("transactions.form.totalPrice")}
          </span>
          <span className="text-sm font-bold text-destructive">
            −${totalPrice.toFixed(2)}
          </span>
        </div>

        {/* Remark */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-widest">
            {t("transactions.form.remark")}
          </Label>
          <Input
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder={t("transactions.form.remarkPlaceholder")}
            maxLength={100}
            className="border-2 font-retro"
          />
          {errors.remark && (
            <p className="text-xs text-destructive">{errors.remark}</p>
          )}
        </div>

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
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 border-2"
          >
            {createMutation.isPending && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            {createMutation.isPending
              ? t("transactions.form.submitting")
              : t("transactions.form.submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}

export { CreateTransactionPage };
