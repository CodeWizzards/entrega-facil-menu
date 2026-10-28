import { ufFrom, type Place } from "@/lib/place";

/** Called in the browser so the provider sees the visitor's IP, not the server's. */
export async function placeFromIp(signal?: AbortSignal): Promise<Place> {
  const controller = new AbortController();
  const cancel = () => controller.abort(signal?.reason);
  if (signal?.aborted) cancel();
  else signal?.addEventListener("abort", cancel, { once: true });
  const timeout = setTimeout(() => controller.abort(), 2500);
  const cancelled = new Promise<never>((_, reject) => {
    const rejectAbort = () => reject(new Error("Confirme sua cidade pelo CEP ou escolha manualmente."));
    if (controller.signal.aborted) rejectAbort();
    else controller.signal.addEventListener("abort", rejectAbort, { once: true });
  });
  try {
    if (controller.signal.aborted) throw new Error("Consulta cancelada.");
    const queries = ["https://ipapi.co/json/", "https://ipwho.is/"].map(async url => {
      const response = await fetch(url, {
        signal: controller.signal,
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!response.ok) throw new Error("Consulta indisponível.");
      const data = await response.json();
      const city = typeof data.city === "string" ? data.city.trim() : "";
      const region = data.region_code || data.region;
      const state = ufFrom(typeof region === "string" ? region : "");
      if (data.error || data.success === false || data.country_code !== "BR" || !city || !state) throw new Error("Região inválida.");
      return { city, state };
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