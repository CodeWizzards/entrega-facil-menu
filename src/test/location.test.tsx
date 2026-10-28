import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocationWelcome } from "@/components/LocationWelcome";
import { SUSHI } from "@/lib/sushi";

describe("Localização inicial", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: vi.fn() } });
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => url.includes("ipapi.co") ? new Promise(() => {}) : Promise.resolve({ ok: true, json: async () => [{ nome: "Ariquemes" }] })));
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("abre sem esperar o IP e permite confirmar a cidade manualmente enquanto ele está pendente", async () => {
    render(<LocationWelcome menu={SUSHI} />);
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "RO" } });
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByLabelText("Cidade"), { target: { value: "Ariquemes" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar localização" }));
    expect(screen.getByRole("button", { name: "Ver cardápio" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Ver cardápio" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("não deixa um IP atrasado substituir o estado escolhido manualmente", async () => {
    let resolveIp: ((value: unknown) => void) | undefined;
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => url.includes("ipapi.co") ? new Promise(resolve => { resolveIp = resolve; }) : Promise.resolve({ ok: true, json: async () => [] })));
    render(<LocationWelcome menu={SUSHI} />);
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "RO" } });
    resolveIp?.({ ok: true, json: async () => ({ city: "São Paulo", region_code: "SP", country_code: "BR" }) });
    await waitFor(() => expect(screen.getByLabelText("Estado")).toHaveValue("RO"));
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes("nominatim"))).toBe(false);
  });

  it("preenche cidade e estado pelo IP sem acionar a permissão de GPS", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => Promise.resolve({ ok: true, json: async () => url.includes("ipapi.co") ? { city: "Ariquemes", region_code: "RO", country_code: "BR" } : [] })));
    render(<LocationWelcome menu={SUSHI} />);
    await waitFor(() => expect(screen.getByLabelText("Cidade")).toHaveValue("Ariquemes"));
    expect(navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });
});