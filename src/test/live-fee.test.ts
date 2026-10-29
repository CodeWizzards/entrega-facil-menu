import { describe, expect, it } from "vitest";
import { LIVE_LOCATION_FEE_CENTS, liveFeeSchema, verifiedPixStatus } from "@/lib/pix";

// A taxa de "localização ao vivo" é cobrada de verdade pela Firebot, então o
// valor não pode vir do navegador e a confirmação não pode aceitar outro Pix.
describe("Taxa de localização ao vivo", () => {
  it("cobra exatamente R$ 7,32", () => {
    expect(LIVE_LOCATION_FEE_CENTS).toBe(732);
    expect(LIVE_LOCATION_FEE_CENTS / 100).toBe(7.32);
  });

  it("exige dois acessos de 64 hexadecimal", () => {
    expect(liveFeeSchema.safeParse({ access: "a".repeat(64), orderAccess: "b".repeat(64) }).success).toBe(true);
    expect(liveFeeSchema.safeParse({ access: "a".repeat(63), orderAccess: "b".repeat(64) }).success).toBe(false);
    expect(liveFeeSchema.safeParse({ access: "a".repeat(64) }).success).toBe(false);
    expect(liveFeeSchema.safeParse({ access: "z".repeat(64), orderAccess: "b".repeat(64) }).success).toBe(false);
  });

  it("não libera o mapa com Pix de outro valor", () => {
    expect(() => verifiedPixStatus({ transactionId: "fire_tx_fee", amount: 0.01, status: "PAID" }, "fire_tx_fee", 7.32)).toThrow();
  });

  it("não libera o mapa com Pix de outra transação", () => {
    expect(() => verifiedPixStatus({ transactionId: "fire_tx_other", amount: 7.32, status: "PAID" }, "fire_tx_fee", 7.32)).toThrow();
  });

  it("confirma só o Pix da própria taxa com valor exato", () => {
    expect(verifiedPixStatus({ transactionId: "fire_tx_fee", amount: 7.32, status: "PAID" }, "fire_tx_fee", 7.32)).toBe("PAID");
  });
});
