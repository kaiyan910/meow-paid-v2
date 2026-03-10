/**
 * EditTransactionPage — loads an existing transaction by ID and
 * renders the shared TransactionForm pre-filled with its data.
 */
import { getRouteApi } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { TransactionForm } from "@/components/transactions/transaction-form";
import { useTransaction, useUpdateTransaction } from "@/hooks/use-transactions";
import type { TransactionFormDefaults } from "@/schemas/transaction.schema";

const routeApi = getRouteApi("/main/transactions/$txId/edit");

function EditTransactionPage() {
  const { t } = useTranslation();
  const { txId } = routeApi.useParams();
  const { data: tx, isLoading: txLoading } = useTransaction(txId);
  const updateMutation = useUpdateTransaction();

  /** Map loaded transaction data to form default values. */
  const defaultValues = useMemo<TransactionFormDefaults | null>(() => {
    if (!tx) return null;
    return {
      transaction_date: new Date(tx.transaction_date),
      shop_id: tx.shop_id,
      payee_id: tx.payee_id,
      remark: tx.remark ?? "",
      items: tx.transaction_items.map((item) => ({
        payment_subtype_id: item.payment_subtype_id,
        price: item.price.toString(),
      })),
    };
  }, [tx]);

  if (txLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!defaultValues) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">
          {t("transactions.form.notFound")}
        </p>
      </div>
    );
  }

  return (
    <TransactionForm
      titleKey="transactions.form.editTitle"
      submitKey="transactions.form.save"
      defaultValues={defaultValues}
      isPending={updateMutation.isPending}
      onSubmit={async (payload) => {
        await updateMutation.mutateAsync({ id: txId, ...payload });
      }}
    />
  );
}

export { EditTransactionPage };
