export type PostalAddress = { street: string; neighborhood: string; city: string; state: string };
export async function lookupPostal(cep: string, signal?: AbortSignal): Promise<PostalAddress> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) throw new Error("Informe um CEP com 8 números.");
  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: signal ?? null });
  if (!response.ok) throw new Error("Não foi possível consultar o CEP. Preencha o endereço manualmente.");
  const data = await response.json();
  if (data.erro || typeof data.localidade !== "string") throw new Error("CEP não encontrado. Confira os números ou preencha manualmente.");
  return { street: data.logradouro ?? "", neighborhood: data.bairro ?? "", city: data.localidade, state: data.uf ?? "" };
}