import { z } from "zod";

export const entryRowsSchema = z.object({
  kind: z.enum(["income", "expense"]),
  rows: z
    .array(
      z.object({
        date: z.string(),
        amount: z.number(),
        category: z.string().optional().nullable(),
        sub_category: z.string().optional().nullable(),
        account: z.string().optional().nullable(),
        account_number: z.string().optional().nullable(),
        account_currency: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        currency: z.string().optional().nullable(),
      }),
    )
    .min(1)
    .max(2000),
});

export const assetRowsSchema = z.object({
  rows: z
    .array(
      z.object({
        name: z.string(),
        asset_type: z.string().optional().nullable(),
        account: z.string().optional().nullable(),
        current_value: z.number(),
        initial_value: z.number().optional().nullable(),
        currency: z.string().optional().nullable(),
      }),
    )
    .min(1)
    .max(2000),
});
