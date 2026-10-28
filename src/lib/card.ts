import { z } from "zod";
import { pixCheckoutSchema } from "@/lib/pix";

export const emptyCard = { number: "", owner: "", expiresAt: "", cvv: "" };
export type CardDetails = typeof emptyCard;
export function formatCardNumber(value: string) { return value.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim(); }
export function formatCardExpiry(value: string) { const digits = value.replace(/\D/g, "").slice(0, 4); return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits; }
export function cardErrors(card: CardDetails, now = new Date()) {
  const errors: Partial<Record<keyof CardDetails, string>> = {};
  const number = card.number.replace(/\D/g, "");
  const sum = [...number].reverse().reduce((total, digit, index) => { const value = Number(digit) * (index % 2 ? 2 : 1); return total + (value > 9 ? value - 9 : value); }, 0);
  if (!/^\d{13,19}$/.test(number) || /^(\d)\1+$/.test(number) || sum % 10 !== 0) errors.number = "Confira o número do cartão.";
  if (!card.owner.trim()) errors.owner = "Informe o titular do cartão.";
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(card.expiresAt);
  if (!match || new Date(2000 + Number(match[2]), Number(match[1]), 1) <= now) errors.expiresAt = "Informe uma validade futura (MM/AA).";
  if (!/^\d{3,4}$/.test(card.cvv)) errors.cvv = "Informe o código de segurança.";
  return errors;
}
export const cardCheckoutSchema = pixCheckoutSchema.extend({ card: z.object({ number: z.string().max(24), owner: z.string().trim().min(1).max(200), expiresAt: z.string().max(5), cvv: z.string().max(4) }) });
export const cardResultSchema = z.object({ success: z.literal(true), transactionId: z.string().startsWith("fire_card_"), status: z.enum(["PAID", "PENDING", "CANCELLED"]), amount: z.number().positive(), currency: z.literal("BRL") });