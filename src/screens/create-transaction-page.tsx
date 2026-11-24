"use client";

/**
 * CreateTransactionPage — renders the shared TransactionForm
 * with empty default values for creating a new transaction.
 */
import { TransactionForm } from "@/components/transactions/transaction-form";
import { useCreateTransaction } from "@/hooks/use-transactions";
import type { TransactionFormDefaults } from "@/schemas/transaction.schema";
import { useState } from "react";

function CreateTransactionPage() {
  const createMutation = useCreateTransaction();
  const [defaultValues] = useState<TransactionFormDefaults>(() => ({
    transaction_date: new Date(),
    shop_id: "",
    payee_id: "",
    discount: "",
    remark: "",
    items: [{ payment_subtype_id: "", price: "" }],
  }));

  return (
    <TransactionForm
      titleKey="transactions.form.title"
      submitKey="transactions.form.submit"
      defaultValues={defaultValues}
      isPending={createMutation.isPending}
      onSubmit={async (payload) => {
        await createMutation.mutateAsync(payload);
      }}
    />
  );
}

export { CreateTransactionPage };
