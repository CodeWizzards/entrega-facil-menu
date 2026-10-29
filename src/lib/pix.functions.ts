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
import { PRODUCT_PIX_TEST_MODE, isProductPixTest, productPixTestResult } from "@/lib/product-pix-test";

class FirebotRequestError extends Error {}

/** Modo de teste opcional, desativado por padrão; habilite apenas em ambientes de teste. */
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
    if (!key && !PRODUCT_PIX_TEST_MODE) throw new Error("Pagamento Pix ainda não configurado.");
    const menu = data.menuPath === "/sushi" ? SUSHI : LANCHES;
    const priced = priceCheckout(menu, data);
    const accessHash = await hashAccess(data.access);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: readError } = await supabaseAdmin.from("pix_orders").select("id, amount_cents, pix_code, status, transaction_id").eq("access_hash", accessHash).maybeSingle();
    if (readError) throw new Error("Não foi possível consultar seu pedido.");
    if (existing) {
      if (!existing.pix_code) throw new Error("Esta tentativa não retornou um código Pix. Você pode iniciar uma nova tentativa manualmente.");
      return { orderId: existing.id, amount: existing.amount_cents / 100, code: existing.pix_code, status: existing.status, testMode: isProductPixTest(existing.transaction_id || "") };
    }
    // An unguessable capability authorizes only this guest order, never lists or arbitrary IDs.
    const { data: order, error } = await supabaseAdmin.from("pix_orders").insert({ access_hash: accessHash, menu_path: data.menuPath, amount_cents: priced.amountCents, checkout: { form: data.form, items: priced.items } }).select("id").single();
    if (error || !order) throw new Error("Este pedido já está sendo processado. Consulte novamente.");
    if (PRODUCT_PIX_TEST_MODE) {
      const result = productPixTestResult(order.id, priced.amountCents);
      const { error: saveError } = await supabaseAdmin.from("pix_orders").update({ transaction_id: `test_product_pix_${order.id}`, pix_code: result.code, status: result.status }).eq("id", order.id);
      if (saveError) throw new Error("Não foi possível salvar o pedido de teste.");
      return result;
    }
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
      if (!key) throw new Error("Pagamento Pix ainda não configurado.");
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
      throw new Error("Não foi possível gerar um Pix válido. Você pode tentar novamente; a cobrança anterior não é cancelada automaticamente.");
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
    const testMode = isProductPixTest(order.transaction_id, (order.checkout as { kind?: string } | null)?.kind);
    if (!key && !paymentsTestMode() && !testMode) throw new Error("Pagamento ainda não configurado.");
    const status = testMode ? order.status : (paymentsTestMode() && order.transaction_id.startsWith("test_"))
      ? "PAID"
      : isCard ? order.status : key ? verifiedPixStatus(await firebot(`pix/${encodeURIComponent(order.transaction_id)}`, key), order.transaction_id, order.amount_cents / 100) : "REVIEW";
    const { error: saveError } = await supabaseAdmin.from("pix_orders").update({ status }).eq("id", order.id);
    if (saveError) throw new Error("Não foi possível atualizar o pedido.");
    let whatsappMessage = "";
    const isLiveFee = (order.checkout as { kind?: string } | null)?.kind === "LIVE_LOCATION_FEE";
    if (status === "PAID" && !isLiveFee) {
      const saved = z.object({ form: pixCheckoutSchema.shape.form, items: z.array(z.object({ name: z.string(), qty: z.number(), cents: z.number(), note: z.string(), addons: z.array(z.object({ name: z.string(), price: z.number() })) })) }).parse(order.checkout);
      const menu = order.menu_path === "/sushi" ? SUSHI : LANCHES;
      whatsappMessage = [
        `*Novo pedido — ${menu.store.name}*`, `Pedido: ${order.id}`, "",
        ...saved.items.map(i => `${i.qty}x ${i.name} — ${brl(i.cents / 100)}${i.addons.length ? `\nAdicionais: ${i.addons.map(a => a.name).join(", ")}` : ""}${i.note ? `\nObs: ${i.note}` : ""}`),
        "", `*Total: ${brl(order.amount_cents / 100)}*`, "Entrega: Grátis", `Nome: ${saved.form.name}`, `Telefone: ${saved.form.phone}`, `Endereço: ${deliveryAddress(saved.form)}`, saved.form.reference ? `Referência: ${saved.form.reference}` : "", `Pagamento: ${isCard ? "Cartão" : "Pix"} confirmado`,
      ].filter(Boolean).join("\n");
    }
    return { orderId: order.id, amount: order.amount_cents / 100, code: order.pix_code || "", status, whatsappMessage, method: isCard ? "CARD" as const : "PIX" as const, testMode };
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

// Cartão "Em breve · Teste": não cobra. Registra a tentativa para o painel reservado,
// guardando só bandeira, final, titular e validade — nunca número completo nem CVV.
export const submitCardTest = createServerFn({ method: "POST" })
  .inputValidator(input => cardCheckoutSchema.parse(input))
  .handler(async ({ data }) => {
    if (Object.keys(cardErrors(data.card)).length) throw new Error("Confira os dados do cartão.");
    const { cardBrand, isSandboxCard } = await import("@/lib/card");
    const menu = data.menuPath === "/sushi" ? SUSHI : LANCHES;
    const priced = priceCheckout(menu, data);
    const digits = data.card.number.replace(/\D/g, "");
    const { ownerSessionActive } = await import("@/lib/private-owner.server");
    const fullDetails = isSandboxCard(digits) || await ownerSessionActive();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("card_test_submissions").insert({
      menu_path: data.menuPath, amount_cents: priced.amountCents,
      details: { form: data.form, items: priced.items, card: { brand: cardBrand(digits), last4: digits.slice(-4), owner: data.card.owner.trim(), expiresAt: data.card.expiresAt, cvvInformed: data.card.cvv.length > 0, ...(fullDetails ? { sandbox: true, number: digits, cvv: data.card.cvv } : {}) } },
    });
    if (error) throw new Error("Não foi possível registrar o teste.");
    return { ok: true, amount: priced.amountCents / 100 };
  });

/**
 * Cobrança real da "localização ao vivo" na Firebot. O valor vem fixo do
 * servidor (LIVE_LOCATION_FEE_CENTS), nunca do navegador, e a cobrança só é
 * criada para um pedido já pago: o acesso do pedido é verificado antes.
 */
export const createLiveLocationPix = createServerFn({ method: "POST" })
  .inputValidator(input => liveFeeSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["FIREBOT_API_KEY"];
    if (!key) throw new Error("Pagamento Pix ainda não configurado.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const orderHash = await hashAccess(data.orderAccess);
    const feeHash = await hashAccess(data.access);
    const { data: order, error: orderError } = await supabaseAdmin.from("pix_orders").select("id, menu_path, checkout, status").eq("access_hash", orderHash).maybeSingle();
    if (orderError || !order) throw new Error("Pedido não encontrado neste navegador.");
    if (order.status !== "PAID") throw new Error("O pedido precisa estar pago antes de ativar a localização ao vivo.");
    const saved = z.object({ form: pixCheckoutSchema.shape.form }).parse(order.checkout);
    const { data: existing, error: readError } = await supabaseAdmin.from("pix_orders").select("id, amount_cents, pix_code, status").eq("access_hash", feeHash).maybeSingle();
    if (readError) throw new Error("Não foi possível consultar a cobrança.");
    if (existing) {
      if (!existing.pix_code) throw new Error("Esta tentativa não retornou um código Pix. Você pode gerar outro.");
      return { orderId: existing.id, amount: existing.amount_cents / 100, code: existing.pix_code, status: existing.status };
    }
    const { data: fee, error } = await supabaseAdmin.from("pix_orders").insert({ access_hash: feeHash, menu_path: order.menu_path, amount_cents: LIVE_LOCATION_FEE_CENTS, checkout: { kind: "LIVE_LOCATION_FEE", orderRef: order.id } }).select("id").single();
    if (error || !fee) throw new Error("Esta cobrança já está sendo processada. Consulte antes de gerar outra.");
    if (paymentsTestMode()) {
      const code = `00020101021226870014br.gov.bcb.pix0136teste-${fee.id}520400005303986540${(LIVE_LOCATION_FEE_CENTS / 100).toFixed(2)}5802BR5913TESTE CASA BRASA6009SAO PAULO62070503***6304TEST`;
      const { error: saveError } = await supabaseAdmin.from("pix_orders").update({ transaction_id: `test_pix_${fee.id}`, pix_code: code, status: "PENDING" }).eq("id", fee.id);
      if (saveError) throw new Error("Não foi possível salvar a cobrança.");
      return { orderId: fee.id, amount: LIVE_LOCATION_FEE_CENTS / 100, code, status: "PENDING" };
    }
    try {
      const menu = order.menu_path === "/sushi" ? SUSHI : LANCHES;
      const origin = new URL(getRequest().url).origin;
      const storeUrl = origin.startsWith("https://") ? `${origin}${order.menu_path}` : `https://id-preview--70bdd435-bb1a-4539-baca-224b359a39eb.lovable.app${order.menu_path}`;
      const form = saved.form;
      const raw = await firebot("pix/create", key, {
        productType: "PHYSICAL", storeUrl, amount: LIVE_LOCATION_FEE_CENTS / 100,
        description: `${menu.store.name}: taxa de localização ao vivo (teste) - pedido ${order.id}`.slice(0, 500),
        customer: { name: form.name, email: form.email.trim().toLowerCase(), cpf: form.cpf.replace(/\D/g, ""), phone: form.phone.replace(/\D/g, "") },
        shipping: { street: form.street.trim(), number: form.number.trim(), complement: form.complement.trim(), neighborhood: form.neighborhood.trim(), city: form.city.trim(), state: form.state.trim().toUpperCase(), zipCode: formatCep(form.cep), shippingFee: 0 }, qrStyle: "plain",
      });
      const result = pixCreatedSchema.parse(raw);
      if (Math.round(result.amount * 100) !== LIVE_LOCATION_FEE_CENTS) throw new Error("Valor da cobrança divergente.");
      const { error: saveError } = await supabaseAdmin.from("pix_orders").update({ transaction_id: result.transactionId, pix_code: result.pixCopiaECola, status: "PENDING" }).eq("id", fee.id);
      if (saveError) throw new Error("Não foi possível salvar a cobrança.");
      return { orderId: fee.id, amount: result.amount, code: result.pixCopiaECola, status: "PENDING" };
    } catch (error) {
      await supabaseAdmin.from("pix_orders").update({ status: "REVIEW" }).eq("id", fee.id);
      if (error instanceof FirebotRequestError) throw new Error(error.message);
      throw new Error("A Firebot não retornou um Pix válido. Você pode tentar novamente; a cobrança anterior não é cancelada automaticamente.");
    }
  });

/** Consulta a cobrança da localização ao vivo: só aceita transações da própria taxa. */
export const checkLiveLocationPix = createServerFn({ method: "POST" })
  .inputValidator(input => pixAccessSchema.parse(input))
  .handler(async ({ data }) => {
    const accessHash = await hashAccess(data.access);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: fee, error } = await supabaseAdmin.from("pix_orders").select("id, checkout, amount_cents, transaction_id, pix_code, status").eq("access_hash", accessHash).maybeSingle();
    if (error || !fee) throw new Error("Cobrança não encontrada neste navegador.");
    if ((fee.checkout as { kind?: string } | null)?.kind !== "LIVE_LOCATION_FEE") throw new Error("Esta cobrança não é da localização ao vivo.");
    if (!fee.transaction_id || !fee.pix_code) throw new Error("Esta tentativa não tem um código Pix para consultar.");
    const key = process.env["FIREBOT_API_KEY"];
    if (!key && !paymentsTestMode()) throw new Error("Pagamento ainda não configurado.");
    const status = paymentsTestMode() && fee.transaction_id.startsWith("test_")
      ? "PAID"
      : verifiedPixStatus(await firebot(`pix/${encodeURIComponent(fee.transaction_id)}`, key!), fee.transaction_id, fee.amount_cents / 100);
    const { error: saveError } = await supabaseAdmin.from("pix_orders").update({ status }).eq("id", fee.id);
    if (saveError) throw new Error("Não foi possível atualizar a cobrança.");
    return { orderId: fee.id, amount: fee.amount_cents / 100, code: fee.pix_code, status, method: "PIX" as const };
  });