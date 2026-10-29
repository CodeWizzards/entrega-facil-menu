import { describe, expect, it } from "vitest";
import { buildInvoice, invoiceText } from "@/lib/invoice";
import { priceCheckout, pixCheckoutSchema } from "@/lib/pix";
import { SUSHI } from "@/lib/sushi";
import { emptyDelivery } from "@/lib/checkout";

const form = {
  ...emptyDelivery,
  name: "Ana Souza", email: "Ana@Example.com", cpf: "529.982.247-25", phone: "(11) 98765-4321",
  cep: "01001-000", street: "Praça da Sé", number: "10", neighborhood: "Sé", city: "São Paulo", state: "SP",
};
const parsed = pixCheckoutSchema.parse({
  access: "a".repeat(64), menuPath: "/sushi", form,
  items: [{ productId: "combo-brasa-16", qty: 2, addonIds: ["shoyu"], note: "sem cebola" }],
});
const priced = priceCheckout(SUSHI, parsed);
// Combo Brasa 16 peças (R$ 68) + Shoyu extra (R$ 3) = R$ 71 a unidade.
const lines = priced.items.map(item => ({
  name: item.name, qty: item.qty, unitCents: Math.round(item.cents / item.qty),
  addons: item.addons.map(addon => addon.name), note: item.note,
}));
const payment = { orderId: "fire_tx_demo123", amount: priced.amountCents / 100, method: "PIX" as const };

describe("Comprovante do pedido", () => {
  it("confere unidade, subtotal, entrega e total com o valor pago", () => {
    const doc = buildInvoice({ menu: SUSHI, payment, form, lines });
    const first = doc.lines[0];
    expect(first?.unitCents).toBe(7100);
    expect(first?.qty).toBe(2);
    expect(doc.subtotalCents).toBe(14200);
    expect(doc.deliveryCents).toBe(0);
    expect(doc.subtotalCents + doc.deliveryCents).toBe(doc.totalCents);
    expect(doc.totalCents).toBe(Math.round(payment.amount * 100));
  });

  it("não emite quando o valor pago não bate com a sacola", () => {
    expect(() => buildInvoice({ menu: SUSHI, payment: { ...payment, amount: 0.01 }, form, lines })).toThrow();
  });

  it("carrega comprador, endereço, pedido e método de pagamento", () => {
    const doc = buildInvoice({ menu: SUSHI, payment, form, lines });
    expect(doc.buyer.email).toBe("ana@example.com");
    expect(doc.buyer.name).toBe("Ana Souza");
    expect(doc.address).toContain("Praça da Sé, 10");
    expect(doc.method).toBe("Pix");
    expect(doc.number).toBe("PED-FIRETXDE");
  });

  it("inclui os itens e totais do pedido sem criar chave fiscal", () => {
    const text = invoiceText(buildInvoice({ menu: SUSHI, payment, form, lines }));
    expect(text).toContain("2x Combo Brasa 16 peças");
    expect(text).toContain("Shoyu extra");
    expect(text).toContain("Observação: sem cebola");
    expect(text).toMatch(/Total: R\$\s142,00/);
    expect(text).not.toMatch(/\d{44}/);
  });
});
