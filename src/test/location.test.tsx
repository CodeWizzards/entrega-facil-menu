import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocationWelcome } from "@/components/LocationWelcome";
import { SUSHI } from "@/lib/sushi";

describe("Localização inicial", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: vi.fn() } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [{ nome: "Ariquemes" }] }));
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("abre sem esperar o GPS e permite confirmar a cidade manualmente enquanto ele está pendente", async () => {
    render(<LocationWelcome menu={SUSHI} />);
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "RO" } });
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByLabelText("Cidade"), { target: { value: "Ariquemes" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar localização" }));
    expect(screen.getByRole("button", { name: "Ver cardápio" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Ver cardápio" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("não deixa um GPS atrasado substituir o estado escolhido manualmente", async () => {
    let success: PositionCallback | undefined;
    vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation(callback => { success = callback; });
    render(<LocationWelcome menu={SUSHI} />);
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "RO" } });
    success?.({ coords: { latitude: -23.5, longitude: -46.6 } } as GeolocationPosition);
    await waitFor(() => expect(screen.getByLabelText("Estado")).toHaveValue("RO"));
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes("nominatim"))).toBe(false);
  });
});