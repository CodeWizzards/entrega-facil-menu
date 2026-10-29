import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocationWelcome } from "@/components/LocationWelcome";
import { SUSHI } from "@/lib/sushi";

function clearCookies() {
  for (const name of ["localCidade", "localEstado"]) {
    document.cookie = `${name}=; max-age=0; path=/`;
  }
}

describe("Localização inicial", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: vi.fn() } });
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => url.includes("get.geojs.io") ? new Promise(() => {}) : Promise.resolve({ ok: true, json: async () => [{ nome: "Ariquemes" }] })));
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); clearCookies(); });

  it("abre sem esperar o IP e permite confirmar a cidade manualmente enquanto ele está pendente", async () => {
    render(<LocationWelcome menu={SUSHI} />);
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Informar minha cidade" }));
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "RO" } });
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByLabelText("Cidade"), { target: { value: "Ariquemes" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar localização" }));
    expect(screen.queryByText("Buscando o delivery mais próximo de você…")).not.toBeInTheDocument();
    expect(document.cookie).toContain("localCidade=Ariquemes");
    await waitFor(() => expect(screen.getByRole("button", { name: "Ver cardápio" })).toBeEnabled(), { timeout: 5000 });
    expect(screen.getByText("1,6 km · distância")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver cardápio" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("não deixa um IP atrasado substituir o estado escolhido manualmente", async () => {
    let resolveIp: ((value: unknown) => void) | undefined;
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => url.includes("get.geojs.io") ? new Promise(resolve => { resolveIp = resolve; }) : Promise.resolve({ ok: true, json: async () => [] })));
    render(<LocationWelcome menu={SUSHI} />);
    fireEvent.click(screen.getByRole("button", { name: "Informar minha cidade" }));
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "RO" } });
    resolveIp?.({ ok: true, json: async () => ({ city: "São Paulo", region: "São Paulo", country_code: "BR" }) });
    await waitFor(() => expect(screen.getByLabelText("Estado")).toHaveValue("RO"));
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes("nominatim"))).toBe(false);
  });

  it("preenche cidade e estado pelo IP sem acionar a permissão de GPS", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => Promise.resolve({ ok: true, json: async () => url.includes("get.geojs.io") ? { city: "Ariquemes", region: "Rondônia", country_code: "BR" } : [] })));
    render(<LocationWelcome menu={SUSHI} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Ver cardápio" })).toBeEnabled());
    expect(screen.queryByLabelText("Estado")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Cidade")).not.toBeInTheDocument();
    expect(navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });

  it("mostra na hora a cidade confirmada antes, sem consultar o IP de novo", async () => {
    document.cookie = "localCidade=Sorocaba; path=/";
    document.cookie = "localEstado=SP; path=/";
    render(<LocationWelcome menu={SUSHI} />);
    expect(await screen.findByText("Sorocaba, SP")).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes("get.geojs.io"))).toBe(false);
  });

  it("salva a escolha em cookies de 365 dias ao abrir o cardápio", async () => {
    render(<LocationWelcome menu={SUSHI} />);
    fireEvent.click(screen.getByRole("button", { name: "Informar minha cidade" }));
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "SP" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByLabelText("Cidade"), { target: { value: "Sorocaba" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar localização" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Ver cardápio" })).toBeEnabled(), { timeout: 5000 });
    fireEvent.click(screen.getByRole("button", { name: "Ver cardápio" }));
    expect(document.cookie).toContain("localCidade=Sorocaba");
    expect(document.cookie).toContain("localEstado=SP");
  });
});
