import { afterEach, describe, expect, it } from "vitest";
import { newPixAccess, readPixAttempts, rememberPixAttempt } from "@/lib/pix-session";

afterEach(() => sessionStorage.clear());
describe("Tentativas manuais Pix", () => {
  it("permite vinte novas tentativas seguidas com acessos distintos", () => {
    const accesses = Array.from({ length: 20 }, () => newPixAccess());
    expect(new Set(accesses).size).toBe(20);
    expect(accesses.every(access => /^[a-f0-9]{64}$/.test(access))).toBe(true);
  });
  it("preserva a consulta da tentativa sem resposta ao criar outra", () => {
    const first = "a".repeat(64), second = "b".repeat(64);
    const history = rememberPixAttempt(rememberPixAttempt([], first), second);
    expect(history.map(attempt => attempt.access)).toEqual([first, second]);
  });
  it("atualiza uma cobrança sem duplicar a tentativa nem guardar contato", () => {
    const access = "a".repeat(64);
    const attempts = rememberPixAttempt([{ access }], access, { orderId: "order1", amount: 68, code: "pix-code", status: "PAID", whatsappMessage: "Dados privados" });
    expect(attempts).toEqual([{ access, payment: { orderId: "order1", amount: 68, code: "pix-code", status: "PENDING" } }]);
  });
  it("recupera tentativas anteriores e a tentativa antiga do navegador", () => {
    sessionStorage.setItem("pix-history:/sushi", JSON.stringify([{ access: "a".repeat(64) }]));
    sessionStorage.setItem("pix:/sushi", JSON.stringify({ access: "b".repeat(64) }));
    expect(readPixAttempts("/sushi").map(attempt => attempt.access)).toEqual(["a".repeat(64), "b".repeat(64)]);
  });
});