// Documento gerado no navegador a partir do pedido já pago.
// NÃO é uma NFS-e: falta CNPJ registrado e emissão na prefeitura.
import { deliveryAddress, type DeliveryDetails } from "@/lib/checkout";
import { brl, type Menu } from "@/lib/menu";

export type InvoiceLine = {
  name: string;
  qty: number;
  /** valor unitário em centavos, com adicionais somados */
  unitCents: number;
  addons: string[];
  note: string;
  /** miniatura da categoria, quando disponível — usada na folha do documento */
  image?: string;
};

export type InvoiceDoc = {
  number: string;
  issuedAt: Date;
  issuer: { name: string; tagline: string };
  buyer: { name: string; cpf: string; email: string; phone: string };
  address: string;
  lines: InvoiceLine[];
  subtotalCents: number;
  deliveryCents: number;
  totalCents: number;
  orderId: string;
  method: string;
};

export const DEMO_LINE = "Documento demonstrativo · sem validade fiscal";

const cents = (value: number) => Math.round(value * 100);
export const money = (value: number) => brl(value / 100);

/** Monta o documento a partir da sacola e confere com o valor efetivamente pago. */
export function buildInvoice({
  menu,
  payment,
  form,
  lines,
}: {
  menu: Menu;
  payment: { orderId: string; amount: number; method?: "PIX" | "CARD" };
  form: DeliveryDetails;
  lines: InvoiceLine[];
}): InvoiceDoc {
  const subtotalCents = lines.reduce((sum, line) => sum + line.unitCents * line.qty, 0);
  const deliveryCents = cents(menu.store.deliveryFee);
  const totalCents = subtotalCents + deliveryCents;
  if (totalCents !== cents(payment.amount)) {
    throw new Error("O valor pago não bate com os itens da sacola. Confira antes de emitir o documento.");
  }
  const serial = payment.orderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
  return {
    number: `NF-${serial || "00000000"}`,
    issuedAt: new Date(),
    issuer: { name: menu.store.name, tagline: menu.store.tagline },
    buyer: {
      name: form.name.trim(),
      cpf: form.cpf.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
    },
    address: deliveryAddress(form),
    lines: lines.map(line => ({ ...line, addons: [...line.addons] })),
    subtotalCents,
    deliveryCents,
    totalCents,
    orderId: payment.orderId,
    method: payment.method === "CARD" ? "Cartão" : "Pix",
  };
}

/** Versão em texto, para copiar ou colar em uma conversa. */
export function invoiceText(doc: InvoiceDoc) {
  const issued = doc.issuedAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  const rows = doc.lines.map(line =>
    `${line.qty}x ${line.name} — ${money(line.unitCents)} un. · ${money(line.unitCents * line.qty)}` +
    (line.addons.length ? `\n   Adicionais: ${line.addons.join(", ")}` : "") +
    (line.note ? `\n   Observação: ${line.note}` : ""),
  );
  return [
    `${doc.issuer.name} · ${doc.issuer.tagline}`,
    DEMO_LINE,
    `Documento ${doc.number} · emitido em ${issued}`,
    `Pedido ${doc.orderId.slice(0, 8).toUpperCase()} · pago no ${doc.method}`,
    "",
    `Comprador: ${doc.buyer.name} · CPF ${doc.buyer.cpf} · ${doc.buyer.email} · ${doc.buyer.phone}`,
    `Entrega: ${doc.address}`,
    "",
    "Itens:",
    ...rows,
    "",
    `Subtotal: ${money(doc.subtotalCents)}`,
    `Entrega: ${doc.deliveryCents ? money(doc.deliveryCents) : "Grátis"}`,
    `Total: ${money(doc.totalCents)}`,
  ].join("\n");
}
