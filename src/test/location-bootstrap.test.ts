import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import { locationBootstrap } from "@/lib/location-bootstrap";

describe("Early location lookup", () => {
  it("reuses a remembered city without a network request", async () => {
    const dom = new JSDOM("", { url: "https://example.com", runScripts: "outside-only" });
    dom.window.document.cookie = "localCidade=Sorocaba; path=/";
    dom.window.document.cookie = "localEstado=SP; path=/";
    const fetcher = vi.fn();
    Object.assign(dom.window, { fetch: fetcher });
    dom.window.eval(locationBootstrap);
    expect(await (dom.window as unknown as { __ipPlaceRaw: Promise<unknown> }).__ipPlaceRaw).toEqual({ city: "Sorocaba", region: "SP", country_code: "BR" });
    expect(fetcher).not.toHaveBeenCalled();
    dom.window.close();
  });

  it("reuses a single early IP request", async () => {
    const dom = new JSDOM("", { url: "https://example.com", runScripts: "outside-only" });
    const response = { city: "Sorocaba", region: "São Paulo", country_code: "BR" };
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => response });
    Object.assign(dom.window, { fetch: fetcher });
    dom.window.eval(locationBootstrap);
    expect(await (dom.window as unknown as { __ipPlaceRaw: Promise<unknown> }).__ipPlaceRaw).toEqual(response);
    dom.window.eval(locationBootstrap);
    expect(fetcher).toHaveBeenCalledTimes(1);
    dom.window.close();
  });
});
