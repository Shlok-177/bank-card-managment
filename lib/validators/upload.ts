import { z } from "zod";

export const uploadMetadataSchema = z.object({
  month: z.string().min(3).max(32),
  uploadedById: z.string().min(1).optional(),
  tenantId: z.string().min(1).default("default")
});

export const fileValidationSchema = z.object({
  name: z.string().regex(/\.(xlsx|xls|csv)$/i, "Only Excel or CSV files are allowed"),
  size: z.number().max(Number(process.env.UPLOAD_MAX_BYTES ?? 10 * 1024 * 1024), "File is too large")
});

export const reportFilterSchema = z.object({
  month: z.string().optional(),
  bank: z.string().optional(),
  dseName: z.string().optional(),
  cardType: z.string().optional(),
  userName: z.string().optional()
});
