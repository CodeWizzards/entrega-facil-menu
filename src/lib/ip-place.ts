import { ufFrom, type Place } from "@/lib/place";

const CITY_COOKIE = "localCidade";
const STATE_COOKIE = "localEstado";
const COOKIE_DAYS = 365;
const GEO_URL = "https://get.geojs.io/v1/ip/geo.json";

declare global {
  interface Window {
    /** Busca de IP iniciada por um script inline no <head>, antes do bundle carregar. */
    __ipPlaceRaw?: Promise<unknown>;
  }
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      try { return decodeURIComponent(trimmed.slice(prefix.length)); } catch { return ""; }
    }
  }
  return "";
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

/** Última cidade confirmada neste aparelho, salva em cookies por 365 dias. */
export function rememberedPlace(): Place | null {
  const city = getCookie(CITY_COOKIE).trim();
  const state = ufFrom(getCookie(STATE_COOKIE));
  return city && state ? { city, state } : null;
}

export function rememberPlace(place: Place) {
  setCookie(CITY_COOKIE, place.city, COOKIE_DAYS);
  setCookie(STATE_COOKIE, place.state, COOKIE_DAYS);
}

function parsePlace(data: unknown): Place | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const city = typeof d["city"] === "string" ? d["city"].trim() : "";
  const state = ufFrom(typeof d["region"] === "string" ? d["region"] : "");
  if (d["country_code"] !== "BR" || !city || !state) return null;
  return { city, state };
}

/** Called in the browser so the provider sees the visitor's IP, not the server's. */
export async function placeFromIp(signal?: AbortSignal): Promise<Place> {
  const controller = new AbortController();
  const cancel = () => controller.abort(signal?.reason);
  if (signal?.aborted) cancel();
  else signal?.addEventListener("abort", cancel, { once: true });
  const timeout = setTimeout(() => controller.abort(), 2000);
  const cancelled = new Promise<never>((_, reject) => {
    const rejectAbort = () => reject(new Error("Confirme sua cidade pelo CEP ou escolha manualmente."));
    if (controller.signal.aborted) rejectAbort();
    else controller.signal.addEventListener("abort", rejectAbort, { once: true });
  });
  try {
    // A busca geralmente já está em andamento desde o HTML inicial; reaproveita.
    const early = typeof window !== "undefined" ? window.__ipPlaceRaw : undefined;
    if (early) {
      const place = parsePlace(await Promise.race([early, cancelled]));
      if (place) return place;
      // The initial request already used its deadline; do not start another
      // request and make the visitor wait twice on a failing connection.
      throw new Error("Região indisponível.");
    }
    if (controller.signal.aborted) throw new Error("Consulta cancelada.");
    const response = await Promise.race([
      fetch(GEO_URL, {
        signal: controller.signal,
        credentials: "omit",
        referrerPolicy: "no-referrer",
      }).then(async r => {
        if (!r.ok) throw new Error("Consulta indisponível.");
        return r.json();
      }),
      cancelled,
    ]);
    const place = parsePlace(response);
    if (!place) throw new Error("Região inválida.");
    return place;
  } catch {
    throw new Error("Confirme sua cidade pelo CEP ou escolha manualmente.");
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
    controller.abort();
  }
}
