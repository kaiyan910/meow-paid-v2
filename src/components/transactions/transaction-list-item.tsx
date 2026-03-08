/**
 * TransactionListItem — single row in the transaction list.
 * Clicking the row toggles an expandable details panel showing payment breakdown.
 */
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, Loader2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import type { ProfileRow, TransactionWithDetails } from "@/types/database";

interface TransactionListItemProps {
  transaction: TransactionWithDetails;
  payee: ProfileRow | undefined;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function TransactionListItem({
  transaction,
  payee,
  onDelete,
  isDeleting,
}: TransactionListItemProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const shop = transaction.shops;
  const items = transaction.transaction_items;
  const date = new Date(transaction.transaction_date);
  const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

  return (
    <li className="rounded-sm border-2 border-border shadow-[2px_2px_0px_0px] shadow-border/40 transition-colors hover:border-primary/60">
      {/* Main row */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full cursor-pointer items-center gap-3 bg-transparent border-none p-3 text-left"
      >
        {/* Shop logo */}
        {shop?.logo && (
          <img
            src={shop.logo}
            alt={shop.name}
            className="size-10 shrink-0 rounded-sm border border-border object-cover"
          />
        )}

        {/* Shop + category */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium tracking-wide">
            {shop?.name ?? "—"}
          </p>
          <p className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
            {shop?.shop_categories?.name ?? ""}
          </p>
          {payee && (
            <p className="truncate text-[10px] tracking-widest text-muted-foreground">
              {payee.display_name ?? payee.user_id}
            </p>
          )}
        </div>

        {/* Price + date */}
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-destructive">
            −${transaction.price.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground">{dateStr}</p>
        </div>

        {/* Expand chevron */}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {/* Expandable details panel */}
      {expanded && (
        <div className="border-t border-border bg-muted/30 px-3 pb-3 pt-2">
          {/* Payment breakdown */}
          <ul className="space-y-1">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground">
                  {item.payment_subtypes?.name ?? "—"}
                </span>
                <span className="font-medium">−${item.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>

          {/* Remark */}
          {transaction.remark && (
            <p className="mt-2 text-[10px] italic text-muted-foreground">
              {transaction.remark}
            </p>
          )}

          {/* Actions */}
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                void navigate({
                  to: "/main/transactions/$txId/edit",
                  params: { txId: transaction.id },
                });
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7 text-muted-foreground hover:text-destructive"
              disabled={isDeleting}
              onClick={(e) => {
                e.stopPropagation();
                setConfirmOpen(true);
              }}
            >
              {isDeleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
            </Button>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("common.deleteConfirm")}
        onConfirm={() => onDelete(transaction.id)}
      />
    </li>
  );
}

export { TransactionListItem };
