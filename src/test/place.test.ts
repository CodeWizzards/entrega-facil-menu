import { afterEach, describe, expect, it, vi } from "vitest";
import { placeFromCoords, ufFrom } from "@/lib/place";

afterEach(() => vi.unstubAllGlobals());

describe("UF a partir do nome", () => {
  it("aceita o código do OpenStreetMap", () => {
    expect(ufFrom("BR-SP")).toBe("SP");
  });

  it("aceita o nome por extenso sem acento", () => {
    expect(ufFrom("São Paulo")).toBe("SP");
    expect(ufFrom("rio de janeiro")).toBe("RJ");
  });

  it("não inventa UF para região desconhecida", () => {
    expect(ufFrom("Bavaria")).toBe("");
    expect(ufFrom("")).toBe("");
  });
});

describe("Cidade e estado pelas coordenadas", () => {
  it("lê a cidade e a UF devolvidas pelo serviço", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ address: { municipality: "Campinas", state: "São Paulo", "ISO3166-2-lvl4": "BR-SP" } }),
    });
    vi.stubGlobal("fetch", fetcher);
    const place = await placeFromCoords(-22.9099, -47.0626);
    expect(place).toEqual({ city: "Campinas", state: "SP" });
    expect(String(fetcher.mock.calls[0]?.[0])).toContain("nominatim.openstreetmap.org/reverse");
  });

  it("pede o CEP quando o serviço não reconhece a região", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ address: { state: "Bavaria" } }) }));
    await expect(placeFromCoords(48.14, 11.58)).rejects.toThrow("Informe seu CEP");
  });
});
