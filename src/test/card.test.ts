import { describe, expect, it } from "vitest";
import { cardErrors, cardResultSchema, formatCardNumber, formatCardExpiry } from "@/lib/card";
const card = { number: "4111 1111 1111 1111", owner: "TESTE", expiresAt: "12/30", cvv: "123" };
describe("Cartão Firebot", () => {
  it("aceita os dados documentados válidos", () => { expect(cardErrors(card, new Date("2026-10-28"))).toEqual({}); });
  it("rejeita número inválido", () => { expect(cardErrors({ ...card, number: "4111111111111112" }).number).toBeTruthy(); });
  it("rejeita validade expirada", () => { expect(cardErrors({ ...card, expiresAt: "01/26" }, new Date("2026-10-28")).expiresAt).toBeTruthy(); });
  it("rejeita CVV fora de três ou quatro números", () => { expect(cardErrors({ ...card, cvv: "12" }).cvv).toBeTruthy(); });
  it("formata número e validade", () => { expect(formatCardNumber("4111111111111111")).toBe("4111 1111 1111 1111"); expect(formatCardExpiry("1230")).toBe("12/30"); });
  it("não aceita confirmação em moeda divergente", () => { expect(cardResultSchema.safeParse({ success: true, transactionId: "fire_card_test", status: "PAID", amount: 68, currency: "USD" }).success).toBe(false); });
});