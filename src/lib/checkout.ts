export type DeliveryDetails = {
  name: string; phone: string; cep: string; street: string; number: string;
  neighborhood: string; city: string; state: string; complement: string; reference: string;
};
export const PAYMENT_METHOD = "Pix" as const;
export const FULFILLMENT_MODE = "entrega" as const;
export const emptyDelivery: DeliveryDetails = {
  name: "", phone: "", cep: "", street: "", number: "", neighborhood: "",
  city: "", state: "", complement: "", reference: "",
};
export function deliveryErrors(form: DeliveryDetails): Partial<Record<keyof DeliveryDetails, string>> {
  const errors: Partial<Record<keyof DeliveryDetails, string>> = {};
  for (const key of ["name", "street", "number", "neighborhood", "city"] as const) {
    if (!form[key].trim()) errors[key] = "Preencha este campo.";
  }
  if (!/^\d{10,11}$/.test(form.phone.replace(/\D/g, ""))) errors.phone = "Informe o WhatsApp com DDD.";
  if (!/^\d{8}$/.test(form.cep.replace(/\D/g, ""))) errors.cep = "Informe um CEP com 8 números.";
  if (!/^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/.test(form.state.toUpperCase().trim())) errors.state = "Informe uma UF válida.";
  return errors;
}
export function deliveryAddress(form: DeliveryDetails) {
  return `${form.street.trim()}, ${form.number.trim()}${form.complement.trim() ? ` — ${form.complement.trim()}` : ""}, ${form.neighborhood.trim()}, ${form.city.trim()}/${form.state.trim().toUpperCase()} — CEP ${form.cep.trim()}`;
}