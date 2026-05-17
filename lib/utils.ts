import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  const cleaned = String(value ?? "")
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sanitizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/[<>]/g, "");
}
