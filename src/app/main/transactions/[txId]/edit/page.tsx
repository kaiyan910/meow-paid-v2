import { notFound } from "next/navigation";

import { idSchema } from "@/schemas/api.schema";
import { EditTransactionPage } from "@/screens/edit-transaction-page";

export default async function EditTransaction({
  params,
}: { params: Promise<{ txId: string }> }) {
  const parsed = idSchema.safeParse((await params).txId);
  if (!parsed.success) notFound();
  return <EditTransactionPage txId={parsed.data} />;
}
