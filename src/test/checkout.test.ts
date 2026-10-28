import { describe, expect, it } from "vitest";
import { deliveryErrors, emptyDelivery, FULFILLMENT_MODE, PAYMENT_METHOD } from "@/lib/checkout";
describe("Regras da finalização", () => {
  it("permite apenas entrega", () => { expect(FULFILLMENT_MODE).toBe("entrega"); });
  it("permite apenas Pix", () => { expect(PAYMENT_METHOD).toBe("Pix"); });
  it("exige contato e endereço completo", () => {
    expect(Object.keys(deliveryErrors(emptyDelivery)).sort()).toEqual(["name", "phone", "cep", "street", "number", "neighborhood", "city", "state"].sort());
    expect(deliveryErrors({ ...emptyDelivery, name: "Maria", phone: "11987654321", cep: "01001-000", street: "Praça da Sé", number: "10", neighborhood: "Sé", city: "São Paulo", state: "SP" })).toEqual({});
  });
});