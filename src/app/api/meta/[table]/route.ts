import type { NextRequest } from "next/server";
import { z } from "zod";

import { readData, requireApiUser } from "@/lib/server/api";
import { toAppLogoUrl, toStoredLogoUrl } from "@/lib/server/shop-logos";
import { idSchema } from "@/schemas/api.schema";
import {
  paymentSubtypeSchema,
  paymentTypeSchema,
  shopCategorySchema,
  shopSchema,
} from "@/schemas/meta.schema";

const writeSchemas = {
  shops: shopSchema.extend({
    shop_category_id: idSchema,
    logo: shopSchema.shape.logo.transform(toStoredLogoUrl),
  }),
  shop_categories: shopCategorySchema,
  payment_types: paymentTypeSchema,
  payment_subtypes: paymentSubtypeSchema.extend({ payment_type_id: idSchema }),
};
const tableSchema = z.enum([
  "shops",
  "shop_categories",
  "payment_types",
  "payment_subtypes",
]);

type Context = { params: Promise<{ table: string }> };

function parseId(request: NextRequest) {
  return idSchema.parse(request.nextUrl.searchParams.get("id"));
}

/** Lists only the application's supported metadata resources. */
export function GET(request: NextRequest, { params }: Context) {
  return requireApiUser(request, async ({ supabase }) => {
    const table = tableSchema.parse((await params).table);
    if (table === "shops") {
      const rows = readData(
        await supabase
          .from(table)
          .select("*, shop_categories(name)")
          .order("created_at", { ascending: false }),
      );
      return rows?.map((row) => ({
        ...row,
        logo: row.logo === null ? null : toAppLogoUrl(row.logo),
      }));
    }
    if (table === "payment_subtypes") {
      const paymentType = request.nextUrl.searchParams.get("paymentType");
      if (paymentType !== null) {
        return readData(
          await supabase
            .from(table)
            .select("id, name")
            .eq("payment_type_id", idSchema.parse(paymentType))
            .order("name"),
        );
      }
      return readData(
        await supabase
          .from(table)
          .select("*, payment_types(name)")
          .order("created_at", { ascending: false }),
      );
    }
    return readData(
      await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false }),
    );
  });
}

/** Creates a metadata row using only fields allowed for the selected table. */
export function POST(request: NextRequest, { params }: Context) {
  return requireApiUser(request, async ({ supabase }) => {
    const table = tableSchema.parse((await params).table);
    const values = writeSchemas[table].parse(await request.json());
    readData(await supabase.from(table).insert(values));
    return null;
  });
}

/** Updates a metadata row under the user's existing database permissions. */
export function PATCH(request: NextRequest, { params }: Context) {
  return requireApiUser(request, async ({ supabase }) => {
    const table = tableSchema.parse((await params).table);
    const id = parseId(request);
    const schema =
      table === "shops"
        ? writeSchemas.shops.extend({
            logo: writeSchemas.shops.shape.logo.nullable(),
          })
        : writeSchemas[table];
    const values = schema.parse(await request.json());
    readData(
      await supabase
        .from(table)
        .update(values)
        .eq("id", id)
        .select("id")
        .single(),
    );
    return null;
  });
}

/** Deletes a metadata row under the user's existing database permissions. */
export function DELETE(request: NextRequest, { params }: Context) {
  return requireApiUser(request, async ({ supabase }) => {
    const table = tableSchema.parse((await params).table);
    readData(await supabase.from(table).delete().eq("id", parseId(request)));
    return null;
  });
}
