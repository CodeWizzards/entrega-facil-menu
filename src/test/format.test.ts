import { describe, expect, it } from "vitest";
import { formatCep, formatCpf, formatEmail, formatPhone } from "@/lib/format";
import { deliveryErrors, emptyDelivery } from "@/lib/checkout";

describe("Formatação dos campos", () => {
  it("formata WhatsApp com DDD", () => {
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
    expect(formatPhone("11 98765-4321")).toBe("(11) 98765-4321");
    expect(formatPhone("+55 11 98765 4321")).toBe("(11) 98765-4321");
    expect(formatPhone("1138765432")).toBe("(11) 3876-5432");
    expect(formatPhone("11")).toBe("(11");
    expect(formatPhone("")).toBe("");
  });
  it("formata CPF", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
    expect(formatCpf("529.982.247-25")).toBe("529.982.247-25");
    expect(formatCpf("52998")).toBe("529.98");
    expect(formatCpf("5299822472512345")).toBe("529.982.247-25");
  });
  it("formata CEP", () => {
    expect(formatCep("01001000")).toBe("01001-000");
    expect(formatCep("01001")).toBe("01001");
    expect(formatCep("01001-0009")).toBe("01001-000");
  });
  it("limpa o e-mail sem inventar nada", () => {
    expect(formatEmail(" Maria@Example.com ")).toBe("maria@example.com");
    expect(formatEmail("maria @example.com")).toBe("maria@example.com");
  });
  it("aceita os valores já formatados no checkout", () => {
    const form = {
      ...emptyDelivery,
      name: "Maria Silva",
      email: "maria@exemplo",
      cpf: formatCpf("52998224725"),
      phone: formatPhone("11987654321"),
      cep: formatCep("01001000"),
      street: "Praça da Sé", number: "10", neighborhood: "Sé", city: "São Paulo", state: "SP",
    };
    expect(deliveryErrors(form)).toEqual({});
  });
});
