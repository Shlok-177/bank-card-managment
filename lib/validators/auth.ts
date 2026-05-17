import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "ANALYST", "VIEWER"]),
  isActive: z.boolean().default(true)
});
