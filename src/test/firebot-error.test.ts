import { describe, expect, it } from "vitest";
import { firebotFailureMessage } from "@/lib/firebot-error";

describe("Recusas Firebot sem dados privados", () => {
  it("identifica e-mail rejeitado sem revelar o valor recebido", () => {
    const result = firebotFailureMessage(400, { error: "Invalid customer.email: private@example.com", apiKey: "private-key" });
    expect(result).toContain("e-mail");
    expect(result).not.toContain("private@example.com");
    expect(result).not.toContain("private-key");
  });
  it("distingue acesso recusado de erro nos dados", () => {
    expect(firebotFailureMessage(403, null)).toContain("habilitação");
    expect(firebotFailureMessage(400, null)).toContain("dados do comprador");
  });
  it("mostra CEP recusado sem repetir endereço do comprador", () => {
    const result = firebotFailureMessage(422, { errors: { "shipping.zipCode": "invalid: 99999-999" } });
    expect(result).toContain("CEP");
    expect(result).not.toContain("99999-999");
  });
});