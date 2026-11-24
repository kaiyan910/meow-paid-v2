import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  usePaymentSubtypes,
  useShopCategories,
  useShops,
} from "@/hooks/use-meta-queries";
import { useProfiles } from "@/hooks/use-profile";
import { confirmReceipt, getReceiptTotals } from "@/lib/receipt";
import { cn } from "@/lib/utils";
import {
  type ReceiptDraft,
  receiptAmountSchema,
} from "@/schemas/receipt.schema";
import type { ReceiptSessionStore } from "@/store/receipt.store";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";

const newShopOption = "new-shop";
const selectClass =
  "h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring";

function ReviewField({
  id,
  label,
  children,
}: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function AmountInput({
  id,
  value,
  change,
}: { id: string; value: string; change: (value: string) => void }) {
  return (
    <Input
      id={id}
      inputMode="decimal"
      value={value}
      placeholder="0.00"
      className="tabular-nums"
      onChange={(event) => {
        const next = event.target.value;
        if (receiptAmountSchema.safeParse(next).success) change(next);
      }}
    />
  );
}

type DraftChange = (change: (draft: ReceiptDraft) => ReceiptDraft) => void;

/** Lets the user pick a saved shop or complete the new shop attached to this draft. */
function ReceiptShopFields({
  draft,
  change,
}: { draft: ReceiptDraft; change: DraftChange }) {
  const { t } = useTranslation();
  const { data: shops } = useShops();
  const { data: categories } = useShopCategories();
  const { newShop } = draft;
  return (
    <div className="flex flex-col gap-3">
      <ReviewField id="receipt-shop" label={t("transactions.form.shop")}>
        <select
          id="receipt-shop"
          className={selectClass}
          value={draft.shopId ?? (newShop ? newShopOption : "")}
          onChange={(event) => {
            const value = event.target.value;
            change((current) =>
              value === newShopOption
                ? {
                    ...current,
                    shopId: null,
                    newShop: current.newShop ?? { name: "", categoryId: null },
                  }
                : { ...current, shopId: value || null, newShop: null },
            );
          }}
        >
          <option value="">{t("receipt.selectShop")}</option>
          {shops?.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
          <option value={newShopOption}>{t("receipt.newShop")}</option>
        </select>
      </ReviewField>
      {newShop && (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/30 p-3">
          <ReviewField id="receipt-shop-name" label={t("receipt.shopName")}>
            <Input
              id="receipt-shop-name"
              value={newShop.name}
              maxLength={120}
              onChange={(event) =>
                change((current) => ({
                  ...current,
                  newShop: { ...newShop, name: event.target.value },
                }))
              }
            />
          </ReviewField>
          <ReviewField
            id="receipt-shop-category"
            label={t("meta.form.shopCategory")}
          >
            <select
              id="receipt-shop-category"
              className={selectClass}
              value={newShop.categoryId ?? ""}
              onChange={(event) =>
                change((current) => ({
                  ...current,
                  newShop: {
                    ...newShop,
                    categoryId: event.target.value || null,
                  },
                }))
              }
            >
              <option value="">{t("meta.form.shopCategoryPlaceholder")}</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </ReviewField>
          <p className="text-xs text-muted-foreground">
            {t("receipt.shopSavedWithTransaction")}
          </p>
        </div>
      )}
    </div>
  );
}

/** Edits recognized receipt lines and keeps each line visible during review. */
function ReceiptLines({
  lines,
  change,
}: { lines: ReceiptDraft["lines"]; change: DraftChange }) {
  const { t } = useTranslation();
  const { data: subtypes } = usePaymentSubtypes();
  const changeLine = (
    id: string,
    values: Partial<ReceiptDraft["lines"][number]>,
  ) =>
    change((draft) => ({
      ...draft,
      lines: draft.lines.map((line) =>
        line.id === id ? { ...line, ...values } : line,
      ),
    }));
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">
        {t("receipt.lines")}
      </legend>
      {lines.map((line, index) => (
        <div
          key={line.id}
          className="flex flex-col gap-2 rounded-md border border-border p-2.5"
        >
          <div className="flex items-center gap-2">
            <Input
              className="flex-1"
              aria-label={t("receipt.lineLabel", { number: index + 1 })}
              placeholder={t("receipt.itemPlaceholder")}
              maxLength={160}
              value={line.label}
              onChange={(event) =>
                changeLine(line.id, { label: event.target.value })
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("receipt.removeLine", { number: index + 1 })}
              onClick={() =>
                change((draft) => ({
                  ...draft,
                  lines: draft.lines.filter((entry) => entry.id !== line.id),
                }))
              }
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-2">
            <ReviewField
              id={`subtype-${line.id}`}
              label={t("transactions.form.paymentSubtype")}
            >
              <select
                id={`subtype-${line.id}`}
                className={selectClass}
                value={line.subtypeId ?? ""}
                onChange={(event) =>
                  changeLine(line.id, { subtypeId: event.target.value || null })
                }
              >
                <option value="">
                  {t("transactions.form.paymentSubtypePlaceholder")}
                </option>
                {subtypes?.map((subtype) => (
                  <option key={subtype.id} value={subtype.id}>
                    {subtype.payment_types
                      ? `${subtype.payment_types.name} · ${subtype.name}`
                      : subtype.name}
                  </option>
                ))}
              </select>
            </ReviewField>
            <ReviewField id={`amount-${line.id}`} label={t("receipt.netItem")}>
              <AmountInput
                id={`amount-${line.id}`}
                value={line.amount}
                change={(amount) => changeLine(line.id, { amount })}
              />
            </ReviewField>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="self-start"
        disabled={lines.length >= 120}
        onClick={() =>
          change((draft) => ({
            ...draft,
            lines: [
              ...draft.lines,
              {
                id: crypto.randomUUID(),
                label: "",
                amount: "",
                subtypeId: null,
              },
            ],
          }))
        }
      >
        <Plus aria-hidden="true" />
        {t("transactions.form.addItem")}
      </Button>
    </fieldset>
  );
}

function ReceiptAmounts({
  draft,
  change,
}: { draft: ReceiptDraft; change: DraftChange }) {
  const { t } = useTranslation();
  const { subtotal, total, difference } = getReceiptTotals(draft);
  const format = (cents: number | null) =>
    cents === null ? "—" : (cents / 100).toFixed(2);
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/30 p-3">
      <div className="grid grid-cols-2 gap-3">
        <ReviewField
          id="receipt-discount"
          label={t("transactions.form.discount")}
        >
          <AmountInput
            id="receipt-discount"
            value={draft.discount}
            change={(discount) =>
              change((current) => ({ ...current, discount }))
            }
          />
        </ReviewField>
        <ReviewField id="receipt-paid-total" label={t("receipt.paidTotal")}>
          <AmountInput
            id="receipt-paid-total"
            value={draft.paidTotal}
            change={(paidTotal) =>
              change((current) => ({ ...current, paidTotal }))
            }
          />
        </ReviewField>
      </div>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm tabular-nums">
        <dt>{t("receipt.subtotal")}</dt>
        <dd>{format(subtotal)}</dd>
        <dt>{t("receipt.calculatedTotal")}</dt>
        <dd>{format(total)}</dd>
        <dt>{t("receipt.difference")}</dt>
        <dd
          className={cn(
            difference !== null &&
              difference !== 0 &&
              "font-semibold text-destructive",
          )}
        >
          {format(difference)}
        </dd>
      </dl>
      {difference !== 0 && (
        <output className="text-xs text-muted-foreground">
          {t(
            difference === null ? "receipt.fillTotal" : "receipt.correctTotal",
          )}
        </output>
      )}
    </div>
  );
}

/** Shows the editable draft and requires a reconciled total before explicit confirmation. */
export function ReceiptReview({
  store,
  busy,
  saving,
  saveError,
  onConfirm,
}: {
  store: ReceiptSessionStore;
  busy: boolean;
  saving: boolean;
  saveError: boolean;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const draft = useStore(store, (state) => state.draft);
  const changeDraft = useStore(store, (state) => state.updateDraft);
  const viewerId = useStore(store, (state) => state.viewerId);
  const payeeId = useStore(
    store,
    (state) => state.payeeId ?? state.viewerId ?? "",
  );
  const { data: profiles } = useProfiles();
  if (!draft) return null;

  const ready = confirmReceipt(draft, payeeId) !== null;
  return (
    <Card className="gap-4">
      <CardHeader className="px-4">
        <CardTitle>
          <h3>{t("receipt.review")}</h3>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (ready && !busy) onConfirm();
          }}
        >
          <fieldset disabled={busy} className="flex min-w-0 flex-col gap-4">
            <ReceiptShopFields draft={draft} change={changeDraft} />
            <div className="grid grid-cols-2 gap-3">
              <ReviewField
                id="receipt-date"
                label={t("transactions.form.transactionDate")}
              >
                <Input
                  id="receipt-date"
                  type="date"
                  value={draft.date}
                  onChange={(event) =>
                    changeDraft((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                />
              </ReviewField>
              <ReviewField
                id="receipt-payee"
                label={t("transactions.form.payee")}
              >
                <select
                  id="receipt-payee"
                  className={selectClass}
                  value={payeeId}
                  onChange={(event) =>
                    store.setState({ payeeId: event.target.value })
                  }
                >
                  <option value="">
                    {t("transactions.form.payeePlaceholder")}
                  </option>
                  {viewerId &&
                    !profiles?.some(
                      (profile) => profile.user_id === viewerId,
                    ) && (
                      <option value={viewerId}>
                        {t("receipt.yourAccount")}
                      </option>
                    )}
                  {profiles?.map((profile) => (
                    <option key={profile.user_id} value={profile.user_id}>
                      {profile.display_name ??
                        (profile.user_id === viewerId
                          ? t("receipt.yourAccount")
                          : profile.user_id)}
                    </option>
                  ))}
                </select>
              </ReviewField>
            </div>
            <ReceiptLines lines={draft.lines} change={changeDraft} />
            <ReceiptAmounts draft={draft} change={changeDraft} />
            {!ready && (
              <p className="text-xs text-muted-foreground">
                {t("receipt.completeDraft")}
              </p>
            )}
            {saveError && (
              <p role="alert" className="text-sm text-destructive">
                {t("transactions.form.saveError")}
              </p>
            )}
            <Button type="submit" disabled={!ready || busy}>
              {saving && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              {t("receipt.confirm")}
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
