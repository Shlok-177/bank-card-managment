import { z } from "zod";

export const bankRuleSchema = z.object({
  bank: z.string().min(2),
  cardType: z.string().optional().nullable(),
  formula: z.object({
    type: z.string().default("difference"),
    expression: z.string().default("payout96 - given")
  }),
  isActive: z.boolean().default(true)
});
