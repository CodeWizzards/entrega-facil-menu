import { afterEach, describe, expect, it, vi } from "vitest";
import { placeFromIp } from "@/lib/ip-place";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe("Cidade aproximada pelo IP", () => {
  it("extrai cidade e UF brasileiras sem pedir GPS", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ city: "Ariquemes", region_code: "RO", country_code: "BR" }) }));
    expect(await placeFromIp()).toEqual({ city: "Ariquemes", state: "RO" });
  });
  it("rejeita um país diferente em vez de inventar uma UF", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ city: "Paris", region_code: "IDF", country_code: "FR" }) }));
    await expect(placeFromIp()).rejects.toThrow();
  });
  it("usa o serviço alternativo quando o primeiro falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, city: "Sorocaba", region: "São Paulo", country_code: "BR" }) }));
    expect(await placeFromIp()).toEqual({ city: "Sorocaba", state: "SP" });
  });
  it("permite cancelar a consulta quando o visitante preenche manualmente", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ city: "Sorocaba", region_code: "SP", country_code: "BR" }) });
    vi.stubGlobal("fetch", fetcher);
    await placeFromIp(controller.signal);
    const usedSignal = fetcher.mock.calls[0]?.[1]?.signal;
    expect(usedSignal).toBeInstanceOf(AbortSignal);
    expect(usedSignal.aborted).toBe(true);
    expect(fetcher).toHaveBeenCalledWith("https://ipapi.co/json/", expect.objectContaining({ credentials: "omit", referrerPolicy: "no-referrer" }));
  });
  it("usa o alternativo imediatamente mesmo quando o primeiro fica travado", async () => {
    const fetcher = vi.fn().mockImplementation((url: string) => url.includes("ipapi.co") ? new Promise(() => {}) : Promise.resolve({ ok: true, json: async () => ({ city: "Sorocaba", region: "São Paulo", country_code: "BR" }) }));
    vi.stubGlobal("fetch", fetcher);
    expect(await placeFromIp()).toEqual({ city: "Sorocaba", state: "SP" });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("encerra a espera em 2500 ms quando ambos os serviços travam", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const result = expect(placeFromIp()).rejects.toThrow("Confirme sua cidade");
    await vi.advanceTimersByTimeAsync(2500);
    await result;
  });
  it("cancela os dois serviços ao solicitar entrada manual", async () => {
    const controller = new AbortController();
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const result = expect(placeFromIp(controller.signal)).rejects.toThrow();
    controller.abort();
    await result;
  });
});