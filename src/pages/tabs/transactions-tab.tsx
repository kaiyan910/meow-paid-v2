/**
 * TransactionsTab — displays monthly transactions with expandable details.
 * Uses a month selector to navigate between months.
 */
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { MonthSelector } from "@/components/transactions/month-selector";
import { TransactionListItem } from "@/components/transactions/transaction-list-item";
import { useProfiles } from "@/hooks/use-profile";
import {
  useDeleteTransaction,
  useTransactions,
} from "@/hooks/use-transactions";
import { useTransactionStore } from "@/store/transaction.store";

function TransactionsTab() {
  const { t } = useTranslation();
  const { currentMonth, prevMonth, nextMonth, setMonth } =
    useTransactionStore();
  const { data: transactions, isLoading } = useTransactions(currentMonth);
  const { data: profiles } = useProfiles();
  const deleteMutation = useDeleteTransaction();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  };

  const total = transactions?.reduce((sum, tx) => sum + tx.price, 0) ?? 0;

  return (
    <div className="space-y-4 p-4">
      {/* Month selector */}
      <MonthSelector
        currentMonth={currentMonth}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onSetMonth={setMonth}
      />

      {/* Transaction list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !transactions || transactions.length === 0 ? (
        <p className="py-12 text-center text-xs tracking-widest uppercase text-muted-foreground">
          {t("transactions.empty")}
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {transactions.map((tx) => {
              const payee = profiles?.find((p) => p.user_id === tx.payee_id);
              return (
                <TransactionListItem
                  key={tx.id}
                  transaction={tx}
                  payee={payee}
                  onDelete={handleDelete}
                  isDeleting={deletingId === tx.id}
                />
              );
            })}
          </ul>

          {/* Monthly total */}
          <div className="flex items-center justify-between border-t-2 border-border pt-3">
            <span className="text-xs font-bold uppercase tracking-widest">
              {t("transactions.total")}
            </span>
            <span className="text-sm font-bold text-destructive">
              −${total.toFixed(2)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export { TransactionsTab };
