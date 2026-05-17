import { z } from "zod";

export const penaltySchema = z.object({
  applicationNo: z.string().min(1),
  amount: z.coerce.number().min(0),
  reason: z.string().min(2)
});
