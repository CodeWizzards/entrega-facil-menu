// Identificação automática de cidade e estado a partir das coordenadas do aparelho.
// Usa o Reverse Geocoding do OpenStreetMap (Nominatim): sem chave, liberado para o navegador.

export type Place = { city: string; state: string };

export const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const UF_BY_NAME: Record<string, string> = {
  acre: "AC",
  alagoas: "AL",
  amapa: "AP",
  amazonas: "AM",
  bahia: "BA",
  ceara: "CE",
  "distrito federal": "DF",
  "espirito santo": "ES",
  goias: "GO",
  maranhao: "MA",
  "mato grosso": "MT",
  "mato grosso do sul": "MS",
  "minas gerais": "MG",
  para: "PA",
  paraiba: "PB",
  parana: "PR",
  pernambuco: "PE",
  piaui: "PI",
  "rio de janeiro": "RJ",
  "rio grande do norte": "RN",
  "rio grande do sul": "RS",
  rondonia: "RO",
  roraima: "RR",
  "santa catarina": "SC",
  "sao paulo": "SP",
  sergipe: "SE",
  tocantins: "TO",
};

/** Converte "BR-SP", "SP" ou "São Paulo" na UF de dois dígitos; devolve "" quando não reconhece. */
export function ufFrom(value: string): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  const upper = raw.toUpperCase();
  if (UFS.includes(upper)) return upper;
  const iso = /^BR-([A-Z]{2})$/.exec(upper);
  if (iso && UFS.includes(iso[1])) return iso[1];
  return UF_BY_NAME[normalize(raw)] ?? "";
}

/**
 * Cidade e estado das coordenadas informadas.
 * Não chuta nada: se o serviço não reconhecer a região, avisa para a pessoa usar o CEP.
 */
export async function placeFromCoords(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<Place> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Não foi possível ler sua localização. Informe seu CEP.");
  }
  const url =
    "https://nominatim.openstreetmap.org/reverse?format=jsonv2" +
    `&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=pt`;
  const response = await fetch(url, { signal: signal ?? null, headers: { "Accept-Language": "pt-BR" } });
  if (!response.ok) throw new Error("Não foi possível identificar sua cidade. Informe seu CEP.");
  const data = await response.json();
  const address = data?.address;
  if (!address || typeof address !== "object") {
    throw new Error("Não foi possível identificar sua cidade. Informe seu CEP.");
  }
  const city = address.city || address.municipality || address.town || address.village || "";
  const state = ufFrom(address["ISO3166-2-lvl4"] || address.state || "");
  if (!city || !state) {
    throw new Error("Não achamos sua cidade e seu estado. Informe seu CEP para continuar.");
  }
  return { city, state };
}
