import { z } from "zod";

export const applicationUpdateSchema = z.object({
  dsa: z.string().optional(),
  applicationNo: z.string().min(1).optional(),
  customerName: z.string().min(1).optional(),
  cardType: z.string().optional(),
  bank: z.string().min(1).optional(),
  userName: z.string().optional(),
  dseName: z.string().optional(),
  payout96: z.coerce.number().optional(),
  given: z.coerce.number().optional()
});
