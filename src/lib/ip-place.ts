import { ufFrom, type Place } from "@/lib/place";

const PLACE_KEY = "casa-brasa:place";
const PLACE_TTL = 24 * 60 * 60 * 1000;

declare global {
  interface Window {
    /** Busca de IP iniciada por um script inline no <head>, antes do bundle carregar. */
    __ipPlaceRaw?: Promise<unknown>;
  }
}

/** Last confirmed city on this device, so returning visitors skip the network wait. */
export function rememberedPlace(now = Date.now()): Place | null {
  try {
    const saved = JSON.parse(localStorage.getItem(PLACE_KEY) || "null");
    if (!saved || typeof saved.city !== "string" || !saved.city.trim() || typeof saved.at !== "number" || now - saved.at > PLACE_TTL) return null;
    const state = ufFrom(String(saved.state || ""));
    return state ? { city: saved.city.trim(), state } : null;
  } catch {
    return null;
  }
}

export function rememberPlace(place: Place, now = Date.now()) {
  try { localStorage.setItem(PLACE_KEY, JSON.stringify({ city: place.city, state: place.state, at: now })); } catch { /* storage unavailable */ }
}

function parsePlace(data: unknown): Place | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const city = typeof d["city"] === "string" ? d["city"].trim() : "";
  const region = d["region_code"] || d["region"];
  const state = ufFrom(typeof region === "string" ? region : "");
  if (d["error"] || d["success"] === false || d["country_code"] !== "BR" || !city || !state) return null;
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
    }
    if (controller.signal.aborted) throw new Error("Consulta cancelada.");
    const queries = ["https://ipapi.co/json/", "https://ipwho.is/"].map(async url => {
      const response = await fetch(url, {
        signal: controller.signal,
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!response.ok) throw new Error("Consulta indisponível.");
      const place = parsePlace(await response.json());
      if (!place) throw new Error("Região inválida.");
      return place;
    });
    return await Promise.race([Promise.any(queries), cancelled]);
  } catch {
    throw new Error("Confirme sua cidade pelo CEP ou escolha manualmente.");
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
    controller.abort();
  }
}
