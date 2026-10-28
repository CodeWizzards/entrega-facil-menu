import { ufFrom, type Place } from "@/lib/place";

/** Called in the browser so the provider sees the visitor's IP, not the server's. */
export async function placeFromIp(signal?: AbortSignal): Promise<Place> {
  const response = await fetch("https://ipapi.co/json/", {
    signal,
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  if (!response.ok) throw new Error("Localização por IP indisponível.");
  const data = await response.json();
  const city = typeof data.city === "string" ? data.city.trim() : "";
  const state = ufFrom(typeof data.region_code === "string" ? data.region_code : "");
  if (data.error || data.country_code !== "BR" || !city || !state) {
    throw new Error("Confirme sua cidade pelo CEP ou escolha manualmente.");
  }
  return { city, state };
}