import type { NextRequest } from "next/server";

import { ApiError, readData, requireApiUser } from "@/lib/server/api";
import {
  saveTransaction,
  transactionSelect,
  withAppShopLogo,
} from "@/lib/server/transactions";
import {
  idSchema,
  transactionRowSchema,
  transactionWriteSchema,
} from "@/schemas/api.schema";

type Context = { params: Promise<{ id: string }> };

/** Loads one transaction with the relationships its edit form needs. */
export function GET(request: NextRequest, { params }: Context) {
  return requireApiUser(request, async ({ supabase }) => {
    const id = idSchema.parse((await params).id);
    const row = readData(
      await supabase
        .from("transactions")
        .select(transactionSelect)
        .eq("id", id)
        .single(),
    );
    if (!row) throw new ApiError(404);
    return withAppShopLogo(transactionRowSchema.parse(row));
  });
}

/** Updates the transaction and replaces its item rows atomically. */
export function PATCH(request: NextRequest, { params }: Context) {
  return requireApiUser(request, async ({ supabase }) => {
    const id = idSchema.parse((await params).id);
    return saveTransaction(
      supabase,
      transactionWriteSchema.parse(await request.json()),
      id,
    );
  });
}

/** Deletes the transaction and its items via the existing cascading foreign key. */
export function DELETE(request: NextRequest, { params }: Context) {
  return requireApiUser(request, async ({ supabase }) => {
    const id = idSchema.parse((await params).id);
    readData(await supabase.from("transactions").delete().eq("id", id));
    return null;
  });
}
