import { afterEach, describe, expect, it, vi } from "vitest";
import { placeFromIp } from "@/lib/ip-place";

afterEach(() => vi.unstubAllGlobals());
describe("Cidade aproximada pelo IP", () => {
  it("extrai cidade e UF brasileiras sem pedir GPS", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ city: "Ariquemes", region_code: "RO", country_code: "BR" }) }));
    expect(await placeFromIp()).toEqual({ city: "Ariquemes", state: "RO" });
  });
  it("rejeita um país diferente em vez de inventar uma UF", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ city: "Paris", region_code: "IDF", country_code: "FR" }) }));
    await expect(placeFromIp()).rejects.toThrow();
  });
  it("permite cancelar a consulta quando o visitante preenche manualmente", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ city: "Sorocaba", region_code: "SP", country_code: "BR" }) });
    vi.stubGlobal("fetch", fetcher);
    await placeFromIp(controller.signal);
    expect(fetcher).toHaveBeenCalledWith("https://ipapi.co/json/", expect.objectContaining({ signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer" }));
  });
});