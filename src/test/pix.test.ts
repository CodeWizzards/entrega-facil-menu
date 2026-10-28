import { describe, expect, it } from "vitest";
import { pixCheckoutSchema, pixCreatedSchema, priceCheckout, verifiedPixStatus } from "@/lib/pix";
import { SUSHI } from "@/lib/sushi";
import { LANCHES } from "@/lib/lanches";
import { emptyDelivery } from "@/lib/checkout";
const form = { ...emptyDelivery, name: "Teste", email: "teste@example.com", cpf: "52998224725", phone: "11987654321", cep: "01001000", street: "Praça da Sé", number: "10", neighborhood: "Sé", city: "São Paulo", state: "SP" };
const baseItem = { productId: "combo-brasa-16", qty: 2, addonIds: ["shoyu"], note: "" };
const input = { access: "a".repeat(64), menuPath: "/sushi" as const, form, items: [baseItem] };
describe("Pix Firebot", () => {
  it("recalcula produtos e adicionais sem confiar no total enviado", () => {
    const parsed = pixCheckoutSchema.parse({ ...input, amount: 0.01 });
    expect(priceCheckout(SUSHI, parsed).amountCents).toBe(14200);
  });
  it("mantém entrega grátis no sushi", () => { expect(priceCheckout(SUSHI, { ...input, items: [{ ...baseItem, qty: 1, addonIds: [] }] }).amountCents).toBe(6800); });
  it("mantém entrega grátis nos lanches", () => { expect(priceCheckout(LANCHES, { ...input, menuPath: "/", items: [{ ...baseItem, productId: "combo-classico", qty: 1, addonIds: [] }] }).amountCents).toBe(4200); });
  it("rejeita adicional inexistente", () => { expect(() => priceCheckout(SUSHI, { ...input, items: [{ ...baseItem, addonIds: ["inexistente"] }] })).toThrow(); });
  it("rejeita adicional repetido", () => { expect(() => priceCheckout(SUSHI, { ...input, items: [{ ...baseItem, addonIds: ["shoyu", "shoyu"] }] })).toThrow(); });
  it("aplica pedido mínimo", () => { expect(() => priceCheckout(SUSHI, { ...input, items: [{ ...baseItem, productId: "agua-sushi", qty: 1, addonIds: [] }] })).toThrow(); });
  it("exige quantidade positiva e inteira", () => { expect(pixCheckoutSchema.safeParse({ ...input, items: [{ ...baseItem, qty: 0 }] }).success).toBe(false); });
  it("exige dados de entrega e CPF do comprador", () => { expect(() => priceCheckout(SUSHI, { ...input, form: emptyDelivery })).toThrow(); });
  it("aceita o retorno de criação documentado", () => { expect(pixCreatedSchema.parse({ success: true, transactionId: "fire_tx_example", amount: 49.9, pixCopiaECola: "00020101021226870014br.gov.bcb.pix2565", status: "PENDING" }).status).toBe("PENDING"); });
  it("só confirma PAID com identificação e valor correspondentes", () => { expect(verifiedPixStatus({ transactionId: "fire_tx_example", amount: 68, status: "PAID" }, "fire_tx_example", 68)).toBe("PAID"); });
  it("não confirma pagamento de outra transação", () => { expect(() => verifiedPixStatus({ transactionId: "fire_tx_other", amount: 68, status: "PAID" }, "fire_tx_example", 68)).toThrow(); });
  it("não confirma valor divergente", () => { expect(() => verifiedPixStatus({ transactionId: "fire_tx_example", amount: 0.01, status: "PAID" }, "fire_tx_example", 68)).toThrow(); });
  it("não inventa confirmação com resposta desconhecida", () => { expect(() => verifiedPixStatus({ success: true }, "fire_tx_example", 68)).toThrow(); });
});