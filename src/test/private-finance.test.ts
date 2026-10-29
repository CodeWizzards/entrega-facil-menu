import { describe, expect, it } from "vitest";
import { requirePrivateFinance, summarizeFinance } from "@/lib/private-finance.server";

const row = { id: "paid", amount_cents: 9900, menu_path: "/sushi", created_at: "2026-10-29T12:00:00Z", status: "PAID", transaction_id: "fire_tx_real", checkout: { form: { cpf: "private" } } };
describe("Finanças reservadas", () => {
  it("nega sessão ausente, manipulada e com apenas senha", () => {
    expect(() => requirePrivateFinance({})).toThrow();
    expect(() => requirePrivateFinance({ unlocked: true })).toThrow();
    expect(() => requirePrivateFinance({ accountKey: "fixture", challengeUntil: Date.now() + 60000 })).toThrow();
    expect(() => requirePrivateFinance({ unlocked: true, mfaVersion: 1 })).not.toThrow();
  });
  it("conta apenas produtos realmente pagos, excluindo testes e taxas", () => {
    const data = summarizeFinance([row, { ...row, id: "pending", status: "PENDING" }, { ...row, transaction_id: "test_pix_123" }, { ...row, transaction_id: "test_product_pix_123" }, { ...row, amount_cents: 732, checkout: { kind: "LIVE_LOCATION_FEE" } }, { ...row, status: "REFUNDED" }], new Date("2026-10-29T20:00:00Z"));
    expect(data.totalCents).toBe(9900);
    expect(data.paidCount).toBe(1);
    expect(data.todayCents).toBe(9900);
    expect(data.orders[0]).not.toHaveProperty("checkout");
  });
  it("não inventa lucro sem custos e taxas", () => {
    expect(summarizeFinance([row]).profitCents).toBeNull();
  });
});