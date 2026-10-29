import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import { locationBootstrap } from "@/lib/location-bootstrap";

describe("Location before React loads", () => {
  it("shows a remembered city without a network request or React", async () => {
    const dom = new JSDOM("<ip-location-preview></ip-location-preview>", { url: "https://example.com", runScripts: "outside-only" });
    dom.window.document.cookie = "localCidade=Sorocaba; path=/";
    dom.window.document.cookie = "localEstado=SP; path=/";
    const fetcher = vi.fn();
    Object.assign(dom.window, { fetch: fetcher });
    dom.window.eval(locationBootstrap);
    await Promise.resolve();
    expect(dom.window.document.querySelector("ip-location-preview")?.shadowRoot?.textContent).toContain("Sorocaba, SP");
    expect(fetcher).not.toHaveBeenCalled();
    dom.window.close();
  });

  it("shows the IP response as text before hydration, including when HTML arrives later", async () => {
    const dom = new JSDOM("", { url: "https://example.com", runScripts: "outside-only" });
    Object.assign(dom.window, { fetch: vi.fn().mockResolvedValue({ ok: true, json: async () => ({ city: "<img src=x>", region: "São Paulo", country_code: "BR" }) }) });
    dom.window.eval(locationBootstrap);
    await (dom.window as unknown as { __ipPlaceRaw: Promise<unknown> }).__ipPlaceRaw;
    dom.window.document.body.innerHTML = "<ip-location-preview></ip-location-preview>";
    await new Promise(resolve => setTimeout(resolve, 0));
    const root = dom.window.document.querySelector("ip-location-preview")?.shadowRoot;
    expect(root?.textContent).toContain("<img src=x>, SP");
    expect(root?.querySelector("img")).toBeNull();
    dom.window.close();
  });
});
