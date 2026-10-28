import { describe, expect, it } from "vitest";
import { deliveryErrors, emptyDelivery, FULFILLMENT_MODE, PAYMENT_METHOD } from "@/lib/checkout";
describe("Regras da finalização", () => {
  it("permite apenas entrega", () => { expect(FULFILLMENT_MODE).toBe("entrega"); });
  it("permite apenas Pix", () => { expect(PAYMENT_METHOD).toBe("Pix"); });
  it("exige contato e endereço completo", () => {
    expect(Object.keys(deliveryErrors(emptyDelivery)).sort()).toEqual(["name", "email", "cpf", "phone", "cep", "street", "number", "neighborhood", "city", "state"].sort());
    expect(deliveryErrors({ ...emptyDelivery, name: "Maria", email: "maria@example.com", cpf: "52998224725", phone: "11987654321", cep: "01001-000", street: "Praça da Sé", number: "10", neighborhood: "Sé", city: "São Paulo", state: "SP" })).toEqual({});
  });
  it("exige e-mail para o Pix Firebot", () => { expect(deliveryErrors({ ...emptyDelivery, email: "inválido" }).email).toBeDefined(); });
  it("aceita e-mail com @ sem exigir domínio completo", () => {
    expect(deliveryErrors({ ...emptyDelivery, email: "maria@exemplo" }).email).toBeUndefined();
    expect(deliveryErrors({ ...emptyDelivery, email: "maria@exemplo.com" }).email).toBeUndefined();
    expect(deliveryErrors({ ...emptyDelivery, email: "mariaexemplo.com" }).email).toBeDefined();
    expect(deliveryErrors({ ...emptyDelivery, email: "@exemplo.com" }).email).toBeDefined();
  });
  it("rejeita CPF com dígitos inválidos", () => { expect(deliveryErrors({ ...emptyDelivery, cpf: "11111111111" }).cpf).toBeDefined(); });
});