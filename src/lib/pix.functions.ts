import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { LANCHES } from "@/lib/lanches";
import { SUSHI } from "@/lib/sushi";
import { pixAccessSchema, pixCheckoutSchema, pixCreatedSchema, priceCheckout, verifiedPixStatus } from "@/lib/pix";
import { brl } from "@/lib/menu";
import { deliveryAddress } from "@/lib/checkout";
import { z } from "zod";

async function hashAccess(access: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(access));
  return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, "0")).join("");
}
async function firebot(path: string, key: string, body?: unknown) {
  const response = await fetch(`https://firebotbr.com/api/v1/pix/${path}`, {
    method: body ? "POST" : "GET",
    headers: { "x-api-key": key, accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    console.error("Firebot request failed", response.status);
    throw new Error("A Firebot não concluiu a solicitação. Consulte este pedido antes de tentar uma nova cobrança.");
  }
  return response.json();
}
export const createPix = createServerFn({ method: "POST" })
  .inputValidator(input => pixCheckoutSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["FIREBOT_API_KEY"];
    if (!key) throw new Error("Pagamento Pix ainda não configurado.");
    const menu = data.menuPath === "/sushi" ? SUSHI : LANCHES;
    const priced = priceCheckout(menu, data);
    const accessHash = await hashAccess(data.access);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: readError } = await supabaseAdmin.from("pix_orders").select("id, amount_cents, pix_code, status").eq("access_hash", accessHash).maybeSingle();
    if (readError) throw new Error("Não foi possível consultar seu pedido.");
    if (existing) {
      if (!existing.pix_code) throw new Error("Esta tentativa não retornou um código Pix. Você pode iniciar uma nova tentativa manualmente.");
      return { orderId: existing.id, amount: existing.amount_cents / 100, code: existing.pix_code, status: existing.status };
    }
    // An unguessable capability authorizes only this guest order, never lists or arbitrary IDs.
    const { data: order, error } = await supabaseAdmin.from("pix_orders").insert({ access_hash: accessHash, menu_path: data.menuPath, amount_cents: priced.amountCents, checkout: { form: data.form, items: priced.items } }).select("id").single();
    if (error || !order) throw new Error("Este pedido já está sendo processado. Consulte novamente.");
    try {
      const origin = new URL(getRequest().url).origin;
      const storeUrl = origin.startsWith("https://") ? `${origin}${data.menuPath}` : `https://id-preview--70bdd435-bb1a-4539-baca-224b359a39eb.lovable.app${data.menuPath}`;
      const form = data.form;
      const raw = await firebot("create", key, {
        productType: "PHYSICAL", storeUrl, amount: priced.amountCents / 100,
        description: `${menu.store.name}: ${priced.items.map(i => `${i.qty}x ${i.name}`).join(", ")}`.slice(0, 500),
        customer: { name: form.name, email: form.email.trim().toLowerCase(), cpf: form.cpf.replace(/\D/g, ""), phone: form.phone.replace(/\D/g, "") },
        shipping: { street: form.street, number: form.number, complement: form.complement, neighborhood: form.neighborhood, city: form.city, state: form.state.toUpperCase(), zipCode: form.cep.replace(/\D/g, ""), shippingFee: menu.store.deliveryFee }, qrStyle: "plain",
      });
      const result = pixCreatedSchema.parse(raw);
      if (Math.round(result.amount * 100) !== priced.amountCents) throw new Error("Valor da cobrança divergente.");
      const { error: saveError } = await supabaseAdmin.from("pix_orders").update({ transaction_id: result.transactionId, pix_code: result.pixCopiaECola, status: "PENDING" }).eq("id", order.id);
      if (saveError) throw new Error("Não foi possível salvar a cobrança.");
      return { orderId: order.id, amount: result.amount, code: result.pixCopiaECola, status: "PENDING" };
    } catch {
      await supabaseAdmin.from("pix_orders").update({ status: "REVIEW" }).eq("id", order.id);
      throw new Error("A Firebot não retornou um Pix válido. Você pode tentar novamente; a cobrança anterior não é cancelada automaticamente.");
    }
  });
export const checkPix = createServerFn({ method: "POST" })
  .inputValidator(input => pixAccessSchema.parse(input))
  .handler(async ({ data }) => {
    const accessHash = await hashAccess(data.access);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin.from("pix_orders").select("id, menu_path, checkout, amount_cents, transaction_id, pix_code, status").eq("access_hash", accessHash).maybeSingle();
    if (error || !order) throw new Error("Pedido não encontrado neste navegador.");
    const key = process.env["FIREBOT_API_KEY"];
    if (!key || !order.transaction_id || !order.pix_code) throw new Error("Esta tentativa não tem um código Pix disponível para consulta. Você pode gerar outro Pix.");
    const raw = await firebot(encodeURIComponent(order.transaction_id), key);
    const status = verifiedPixStatus(raw, order.transaction_id, order.amount_cents / 100);
    const { error: saveError } = await supabaseAdmin.from("pix_orders").update({ status }).eq("id", order.id);
    if (saveError) throw new Error("Não foi possível atualizar o pedido.");
    let whatsappMessage = "";
    if (status === "PAID") {
      const saved = z.object({ form: pixCheckoutSchema.shape.form, items: z.array(z.object({ name: z.string(), qty: z.number(), cents: z.number(), note: z.string(), addons: z.array(z.object({ name: z.string(), price: z.number() })) })) }).parse(order.checkout);
      const menu = order.menu_path === "/sushi" ? SUSHI : LANCHES;
      whatsappMessage = [
        `*Novo pedido — ${menu.store.name}*`, `Pedido: ${order.id}`, "",
        ...saved.items.map(i => `${i.qty}x ${i.name} — ${brl(i.cents / 100)}${i.addons.length ? `\nAdicionais: ${i.addons.map(a => a.name).join(", ")}` : ""}${i.note ? `\nObs: ${i.note}` : ""}`),
        "", `*Total: ${brl(order.amount_cents / 100)}*`, "Entrega: Grátis", `Nome: ${saved.form.name}`, `Telefone: ${saved.form.phone}`, `Endereço: ${deliveryAddress(saved.form)}`, saved.form.reference ? `Referência: ${saved.form.reference}` : "", "Pagamento: Pix confirmado pela Firebot",
      ].filter(Boolean).join("\n");
    }
    return { orderId: order.id, amount: order.amount_cents / 100, code: order.pix_code, status, whatsappMessage };
  });