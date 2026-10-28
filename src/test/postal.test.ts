import { afterEach, describe, expect, it, vi } from "vitest";
import { lookupPostal } from "@/lib/postal";
afterEach(() => vi.unstubAllGlobals());
describe("Consulta de CEP", () => {
  it("preenche rua, bairro, cidade e UF a partir do CEP", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ logradouro: "Praça da Sé", bairro: "Sé", localidade: "São Paulo", uf: "SP" }) });
    vi.stubGlobal("fetch", fetcher);
    expect(await lookupPostal("01001-000")).toEqual({ street: "Praça da Sé", neighborhood: "Sé", city: "São Paulo", state: "SP" });
    expect(fetcher).toHaveBeenCalledWith("https://viacep.com.br/ws/01001000/json/", { signal: null });
  });
  it("não preenche endereço inventado para CEP inexistente", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ erro: true }) }));
    await expect(lookupPostal("00000000")).rejects.toThrow("CEP não encontrado");
  });
});