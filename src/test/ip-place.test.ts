import { afterEach, describe, expect, it, vi } from "vitest";
import { placeFromIp } from "@/lib/ip-place";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe("Cidade aproximada pelo IP (geojs)", () => {
  it("extrai cidade e UF brasileiras sem pedir GPS", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ city: "Ariquemes", region: "Rondônia", country_code: "BR" }) }));
    expect(await placeFromIp()).toEqual({ city: "Ariquemes", state: "RO" });
  });
  it("rejeita um país diferente em vez de inventar uma UF", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ city: "Paris", region: "Île-de-France", country_code: "FR" }) }));
    await expect(placeFromIp()).rejects.toThrow();
  });
  it("rejeita resposta sem cidade em vez de mostrar Local Desconhecido", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ region: "São Paulo", country_code: "BR" }) }));
    await expect(placeFromIp()).rejects.toThrow();
  });
  it("consulta o geojs sem credenciais nem referrer", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ city: "Sorocaba", region: "São Paulo", country_code: "BR" }) });
    vi.stubGlobal("fetch", fetcher);
    await placeFromIp();
    expect(fetcher).toHaveBeenCalledWith("https://get.geojs.io/v1/ip/geo.json", expect.objectContaining({ credentials: "omit", referrerPolicy: "no-referrer" }));
  });
  it("permite cancelar a consulta quando o visitante preenche manualmente", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ city: "Sorocaba", region: "São Paulo", country_code: "BR" }) });
    vi.stubGlobal("fetch", fetcher);
    await placeFromIp(controller.signal);
    const usedSignal = fetcher.mock.calls[0]?.[1]?.signal;
    expect(usedSignal).toBeInstanceOf(AbortSignal);
    expect(usedSignal.aborted).toBe(true);
  });
  it("encerra a espera em 2000 ms quando o serviço trava", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const result = expect(placeFromIp()).rejects.toThrow("Confirme sua cidade");
    await vi.advanceTimersByTimeAsync(2000);
    await result;
  });
  it("cancela a consulta ao solicitar entrada manual", async () => {
    const controller = new AbortController();
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const result = expect(placeFromIp(controller.signal)).rejects.toThrow();
    controller.abort();
    await result;
  });
});
