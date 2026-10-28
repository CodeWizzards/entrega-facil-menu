export type DeliveryDetails = {
  name: string; email: string; cpf: string; phone: string; cep: string; street: string; number: string;
  neighborhood: string; city: string; state: string; complement: string; reference: string;
};
export const PAYMENT_METHOD = "Pix" as const;
export const FULFILLMENT_MODE = "entrega" as const;
export const emptyDelivery: DeliveryDetails = {
  name: "", email: "", cpf: "", phone: "", cep: "", street: "", number: "", neighborhood: "",
  city: "", state: "", complement: "", reference: "",
};
export function deliveryErrors(form: DeliveryDetails): Partial<Record<keyof DeliveryDetails, string>> {
  const errors: Partial<Record<keyof DeliveryDetails, string>> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Informe um e-mail válido.";
  if (!validCpf(form.cpf)) errors.cpf = "Informe um CPF válido.";
  for (const key of ["name", "street", "number", "neighborhood", "city"] as const) {
    if (!form[key].trim()) errors[key] = "Preencha este campo.";
  }
  if (!/^\d{10,11}$/.test(form.phone.replace(/\D/g, ""))) errors.phone = "Informe o WhatsApp com DDD.";
  if (!/^\d{8}$/.test(form.cep.replace(/\D/g, ""))) errors.cep = "Informe um CEP com 8 números.";
  if (!/^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/.test(form.state.toUpperCase().trim())) errors.state = "Informe uma UF válida.";
  return errors;
}
export function validCpf(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  for (const length of [9, 10]) {
    const sum = Array.from(digits.slice(0, length)).reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const check = (sum * 10) % 11 % 10;
    if (check !== Number(digits[length])) return false;
  }
  return true;
}
export function deliveryAddress(form: DeliveryDetails) {
  return `${form.street.trim()}, ${form.number.trim()}${form.complement.trim() ? ` — ${form.complement.trim()}` : ""}, ${form.neighborhood.trim()}, ${form.city.trim()}/${form.state.trim().toUpperCase()} — CEP ${form.cep.trim()}`;
}