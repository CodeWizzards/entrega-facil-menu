/** Formatações aplicadas enquanto a pessoa digita. Sempre a partir dos dígitos, então colar um número solto funciona. */

const digits = (value: string) => value.replace(/\D/g, "");

/** (11) 98765-4321 ou (11) 3876-5432. Começa com 9 = celular, então apagar o último dígito não vira um telefone fixo. */
export function formatPhone(value: string) {
  const d = digits(value).slice(0, 11);
  if (!d.length) return "";
  if (d.length <= 2) return `(${d}`;
  const ddd = `(${d.slice(0, 2)}) `;
  const local = d.slice(2);
  if (local[0] === "9") return local.length <= 5 ? ddd + local : `${ddd}${local.slice(0, 5)}-${local.slice(5)}`;
  return local.length <= 4 ? ddd + local : `${ddd}${local.slice(0, 4)}-${local.slice(4)}`;
}

/** 529.982.247-25 */
export function formatCpf(value: string) {
  const d = digits(value).slice(0, 11);
  const a = d.slice(0, 3), b = d.slice(3, 6), c = d.slice(6, 9), e = d.slice(9, 11);
  if (d.length <= 3) return a;
  if (d.length <= 6) return `${a}.${b}`;
  if (d.length <= 9) return `${a}.${b}.${c}`;
  return `${a}.${b}.${c}-${e}`;
}

/** 01001-000 */
export function formatCep(value: string) {
  const d = digits(value).slice(0, 8);
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
}

/** Só limpa espaços e deixa em minúsculas: não inventa nada, não esconde o que a pessoa digitou. */
export function formatEmail(value: string) {
  return value.replace(/\s/g, "").toLowerCase();
}
