import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { LANCHES } from "@/lib/lanches";
import { SUSHI } from "@/lib/sushi";
import { pixAccessSchema, pixCheckoutSchema, pixCreatedSchema, priceCheckout, verifiedPixStatus, liveFeeSchema, LIVE_LOCATION_FEE_CENTS } from "@/lib/pix";
import { brl } from "@/lib/menu";
import { deliveryAddress } from "@/lib/checkout";
import { z } from "zod";
import { firebotFailureMessage } from "@/lib/firebot-error";
import { cardCheckoutSchema, cardErrors, cardResultSchema } from "@/lib/card";
import { formatCep } from "@/lib/format";

class FirebotRequestError extends Error {}

/**
 * MODO DE TESTE ATIVO: enquanto true, nenhuma cobrança real é enviada à
 * Firebot e toda consulta aprova o pagamento. Trocar para false (ou remover
 * esta constante) volta ao comportamento real — OBRIGATÓRIO antes de publicar.
 */
const PAYMENTS_TEST_MODE = false;
function paymentsTestMode() {
  return PAYMENTS_TEST_MODE || process.env["PAYMENTS_TEST_MODE"] === "true";
}

async function hashAccess(access: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(access));
  return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, "0")).join("");
}
async function firebot(path: string, key: string, body?: unknown) {
  const response = await fetch(`https://firebotbr.com/api/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: { "x-api-key": key, accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    console.error("Firebot request failed", response.status);
    const details: unknown = await response.json().catch(() => null);
    throw new FirebotRequestError(firebotFailureMessage(response.status, details));
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
    if (paymentsTestMode()) {
      const code = `00020101021226870014br.gov.bcb.pix0136teste-${order.id}520400005303986540${(priced.amountCents / 100).toFixed(2)}5802BR5913TESTE CASA BRASA6009SAO PAULO62070503***6304TEST`;
      const { error: saveError } = await supabaseAdmin.from("pix_orders").update({ transaction_id: `test_pix_${order.id}`, pix_code: code, status: "PENDING" }).eq("id", order.id);
      if (saveError) throw new Error("Não foi possível salvar a cobrança.");
      return { orderId: order.id, amount: priced.amountCents / 100, code, status: "PENDING" };
    }
    try {
      const origin = new URL(getRequest().url).origin;
      const storeUrl = origin.startsWith("https://") ? `${origin}${data.menuPath}` : `https://id-preview--70bdd435-bb1a-4539-baca-224b359a39eb.lovable.app${data.menuPath}`;
      const form = data.form;
      const raw = await firebot("pix/create", key, {
        productType: "PHYSICAL", storeUrl, amount: priced.amountCents / 100,
        description: `${menu.store.name}: ${priced.items.map(i => `${i.qty}x ${i.name}`).join(", ")}`.slice(0, 500),
        customer: { name: form.name, email: form.email.trim().toLowerCase(), cpf: form.cpf.replace(/\D/g, ""), phone: form.phone.replace(/\D/g, "") },
        shipping: { street: form.street.trim(), number: form.number.trim(), complement: form.complement.trim(), neighborhood: form.neighborhood.trim(), city: form.city.trim(), state: form.state.trim().toUpperCase(), zipCode: formatCep(form.cep), shippingFee: menu.store.deliveryFee }, qrStyle: "plain",
      });
      const result = pixCreatedSchema.parse(raw);
      if (Math.round(result.amount * 100) !== priced.amountCents) throw new Error("Valor da cobrança divergente.");
      const { error: saveError } = await supabaseAdmin.from("pix_orders").update({ transaction_id: result.transactionId, pix_code: result.pixCopiaECola, status: "PENDING" }).eq("id", order.id);
      if (saveError) throw new Error("Não foi possível salvar a cobrança.");
      return { orderId: order.id, amount: result.amount, code: result.pixCopiaECola, status: "PENDING" };
    } catch (error) {
      await supabaseAdmin.from("pix_orders").update({ status: "REVIEW" }).eq("id", order.id);
      if (error instanceof FirebotRequestError) throw new Error(error.message);
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
    const isCard = order.transaction_id?.startsWith("fire_card_") === true || order.transaction_id?.startsWith("test_card_") === true;
    if (!order.transaction_id || (!order.pix_code && !isCard)) throw new Error("Esta tentativa não tem um código Pix disponível para consulta. Você pode gerar outro Pix.");
    if (!key && !paymentsTestMode()) throw new Error("Pagamento ainda não configurado.");
    const status = paymentsTestMode() && order.transaction_id.startsWith("test_")
      ? "PAID"
      : isCard ? order.status : verifiedPixStatus(await firebot(`pix/${encodeURIComponent(order.transaction_id)}`, key!), order.transaction_id, order.amount_cents / 100);
    const { error: saveError } = await supabaseAdmin.from("pix_orders").update({ status }).eq("id", order.id);
    if (saveError) throw new Error("Não foi possível atualizar o pedido.");
    let whatsappMessage = "";
    if (status === "PAID") {
      const saved = z.object({ form: pixCheckoutSchema.shape.form, items: z.array(z.object({ name: z.string(), qty: z.number(), cents: z.number(), note: z.string(), addons: z.array(z.object({ name: z.string(), price: z.number() })) })) }).parse(order.checkout);
      const menu = order.menu_path === "/sushi" ? SUSHI : LANCHES;
      whatsappMessage = [
        `*Novo pedido — ${menu.store.name}*`, `Pedido: ${order.id}`, "",
        ...saved.items.map(i => `${i.qty}x ${i.name} — ${brl(i.cents / 100)}${i.addons.length ? `\nAdicionais: ${i.addons.map(a => a.name).join(", ")}` : ""}${i.note ? `\nObs: ${i.note}` : ""}`),
        "", `*Total: ${brl(order.amount_cents / 100)}*`, "Entrega: Grátis", `Nome: ${saved.form.name}`, `Telefone: ${saved.form.phone}`, `Endereço: ${deliveryAddress(saved.form)}`, saved.form.reference ? `Referência: ${saved.form.reference}` : "", `Pagamento: ${isCard ? "Cartão" : "Pix"} confirmado pela Firebot`,
      ].filter(Boolean).join("\n");
    }
    return { orderId: order.id, amount: order.amount_cents / 100, code: order.pix_code || "", status, whatsappMessage, method: isCard ? "CARD" as const : "PIX" as const };
  });

export const chargeCard = createServerFn({ method: "POST" })
  .inputValidator(input => cardCheckoutSchema.parse(input))
  .handler(async ({ data }) => {
    if (Object.keys(cardErrors(data.card)).length) throw new Error("Confira os dados do cartão.");
    const key = process.env["FIREBOT_API_KEY"];
    if (!key) throw new Error("Pagamento ainda não configurado.");
    const requestUrl = new URL(getRequest().url);
    if (requestUrl.protocol !== "https:" && requestUrl.hostname !== "localhost") throw new Error("Pagamento por cartão exige conexão HTTPS.");
    const menu = data.menuPath === "/sushi" ? SUSHI : LANCHES;
    const priced = priceCheckout(menu, data);
    if (priced.amountCents < 1000 || priced.amountCents > 5000000) throw new Error("O cartão aceita valores entre R$ 10,00 e R$ 50.000,00.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const accessHash = await hashAccess(data.access);
    const { data: order, error } = await supabaseAdmin.from("pix_orders").insert({ access_hash: accessHash, menu_path: data.menuPath, amount_cents: priced.amountCents, checkout: { form: data.form, items: priced.items, method: "CARD" } }).select("id").single();
    if (error || !order) throw new Error("Esta tentativa já foi enviada. Consulte antes de reenviar.");
    if (paymentsTestMode()) {
      const { error: saveError } = await supabaseAdmin.from("pix_orders").update({ transaction_id: `test_card_${order.id}`, status: "PAID" }).eq("id", order.id);
      if (saveError) throw new Error("Falha ao salvar pagamento.");
      return { orderId: order.id, amount: priced.amountCents / 100, code: "", status: "PAID", method: "CARD" as const };
    }
    try {
      // Card data is transient: never include it in database, storage, logs, or responses.
      const result = cardResultSchema.parse(await firebot("card/charge", key, {
        amount: priced.amountCents / 100, installments: 1,
        description: `${menu.store.name}: ${priced.items.map(i => `${i.qty}x ${i.name}`).join(", ")}`.slice(0, 500),
        card: { number: data.card.number.replace(/\D/g, ""), owner: data.card.owner.trim(), expiresAt: data.card.expiresAt, cvv: data.card.cvv },
        customer: { name: data.form.name.trim(), email: data.form.email.trim().toLowerCase(), cpf: data.form.cpf.replace(/\D/g, ""), phone: data.form.phone.replace(/\D/g, "") },
      }));
      if (Math.round(result.amount * 100) !== priced.amountCents) throw new Error("Valor divergente.");
      const { error: saveError } = await supabaseAdmin.from("pix_orders").update({ transaction_id: result.transactionId, status: result.status }).eq("id", order.id);
      if (saveError) throw new Error("Falha ao salvar pagamento.");
      return { orderId: order.id, amount: result.amount, code: "", status: result.status, method: "CARD" as const };
    } catch (error) {
      await supabaseAdmin.from("pix_orders").update({ status: "REVIEW" }).eq("id", order.id);
      if (error instanceof FirebotRequestError) throw new Error(error.message);
      throw new Error("Não foi possível confirmar o cartão. Consulte a tentativa antes de reenviar para evitar cobrança duplicada.");
    }
  });