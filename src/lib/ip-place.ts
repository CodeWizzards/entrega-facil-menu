import { ufFrom, type Place } from "@/lib/place";

/** Called in the browser so the provider sees the visitor's IP, not the server's. */
export async function placeFromIp(signal?: AbortSignal): Promise<Place> {
  for (const url of ["https://ipapi.co/json/", "https://ipwho.is/"]) {
    try {
      const response = await fetch(url, {
        signal: signal ?? null,
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!response.ok) continue;
      const data = await response.json();
      const city = typeof data.city === "string" ? data.city.trim() : "";
      const region = data.region_code || data.region;
      const state = ufFrom(typeof region === "string" ? region : "");
      if (data.error || data.success === false || data.country_code !== "BR" || !city || !state) continue;
      return { city, state };
    } catch (error) {
      if (signal?.aborted) throw error;
    }
  }
  throw new Error("Confirme sua cidade pelo CEP ou escolha manualmente.");
}