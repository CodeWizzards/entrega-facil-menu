import { initialSetupAccess, privateAccessGranted, type PrivateSessionData } from "@/lib/private-totp.server";

type FinancialRow = {
  id: string; amount_cents: number; menu_path: string; created_at: string;
  status: string; transaction_id: string | null; checkout: unknown;
};

export function requirePrivateFinance(data: PrivateSessionData, enrolled = true) {
  if (!privateAccessGranted(data) && !initialSetupAccess(data, enrolled)) throw new Error("Acesso não autorizado.");
}

export function summarizeFinance(rows: FinancialRow[], now = new Date()) {
  const paid = rows.filter(row => {
    const checkout = row.checkout as { kind?: unknown } | null;
    return row.status === "PAID" && /^fire_(tx|card)_/.test(row.transaction_id ?? "")
      && !checkout?.kind && Number.isSafeInteger(row.amount_cents) && row.amount_cents > 0;
  });
  const dateKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const today = dateKey(now);
  const month = today.slice(0, 7);
  const totalCents = paid.reduce((sum, row) => sum + row.amount_cents, 0);
  const chart = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getTime() - (6 - index) * 86400000);
    const key = dateKey(date);
    return { date: key, label: new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short" }).format(date), cents: paid.filter(row => dateKey(new Date(row.created_at)) === key).reduce((sum, row) => sum + row.amount_cents, 0) };
  });
  return {
    totalCents, paidCount: paid.length,
    todayCents: paid.filter(row => dateKey(new Date(row.created_at)) === today).reduce((sum, row) => sum + row.amount_cents, 0),
    monthCents: paid.filter(row => dateKey(new Date(row.created_at)).startsWith(month)).reduce((sum, row) => sum + row.amount_cents, 0),
    averageCents: paid.length ? Math.round(totalCents / paid.length) : 0,
    profitCents: null,
    chart,
    orders: [...paid].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 50).map(row => ({
      id: row.id, amountCents: row.amount_cents, store: row.menu_path === "/sushi" ? "Sushi" : "Lanches",
      method: row.transaction_id?.startsWith("fire_card_") ? "Cartão" : "Pix", createdAt: row.created_at,
    })),
    updatedAt: now.toISOString(),
  };
}

export async function loadPrivateFinance(session: PrivateSessionData, enrolled = true) {
  requirePrivateFinance(session, enrolled);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const rows: FinancialRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabaseAdmin.from("pix_orders")
      .select("id,amount_cents,menu_path,created_at,status,transaction_id,checkout")
      .eq("status", "PAID").order("id").range(offset, offset + 999);
    if (error) throw new Error("Não foi possível consultar os pagamentos.");
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return summarizeFinance(rows);
}