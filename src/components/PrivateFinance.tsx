import { Banknote, CheckCheck, CircleDollarSign, RefreshCw, ShieldCheck, ShoppingBag, TrendingUp } from "lucide-react";
import { brl } from "@/lib/menu";
import type { readPrivatePage } from "@/lib/private-access.functions";

type Finance = NonNullable<Awaited<ReturnType<typeof readPrivatePage>>["finance"]>;

export function PrivateFinance({ finance, refresh, busy }: { finance: Finance; refresh: () => void; busy: boolean }) {
  const max = Math.max(1, ...finance.chart.map(day => day.cents));
  const metrics = [
    { label: "Faturamento total", value: brl(finance.totalCents / 100), icon: CircleDollarSign },
    { label: "Hoje", value: brl(finance.todayCents / 100), icon: TrendingUp },
    { label: "Neste mês", value: brl(finance.monthCents / 100), icon: Banknote },
    { label: "Pedidos pagos", value: String(finance.paidCount), icon: ShoppingBag },
  ];
  return <div className="pv-finance mt-8 space-y-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-success" />Acesso protegido</span>
      <button type="button" className="pv-btn" disabled={busy} onClick={refresh}><RefreshCw className={busy ? "animate-spin" : ""} />Atualizar</button>
    </div>
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumo financeiro">
      {metrics.map(({ label, value, icon: Icon }) => <div key={label} className="pv-metric">
        <span className="pv-tile mb-4"><Icon /></span><p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-2 break-words text-xl font-semibold tabular-nums">{value}</p>
      </div>)}
    </section>
    <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
      <section className="pv-panel"><h2 className="text-base font-semibold">Últimos 7 dias</h2>
        <div className="mt-5 grid h-48 grid-cols-7 items-end gap-2" aria-label="Faturamento dos últimos sete dias">
          {finance.chart.map(day => <div key={day.date} className="flex h-full flex-col items-center justify-end gap-2">
            <span className="text-[10px] text-muted-foreground tabular-nums">{brl(day.cents / 100)}</span>
            <div className="flex h-32 w-full items-end justify-center"><div className="pv-bar w-3/4" style={{ height: `${Math.max(2, day.cents / max * 100)}%` }} /></div>
            <span className="text-xs text-muted-foreground">{day.label}</span>
          </div>)}
        </div>
      </section>
      <section className="pv-panel space-y-5"><div><h2 className="text-sm text-muted-foreground">Ticket médio</h2><p className="mt-2 text-2xl font-semibold">{brl(finance.averageCents / 100)}</p></div>
        <div><h2 className="text-sm text-muted-foreground">Lucro líquido</h2><p className="mt-2 font-semibold">A calcular</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Custos dos produtos, despesas e taxas ainda não informados.</p></div>
      </section>
    </div>
    <section className="pv-panel"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Pedidos pagos</h2><span className="text-xs text-muted-foreground">Últimos 50</span></div>
      {finance.orders.length ? <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="pb-3 font-medium">Pedido</th><th className="pb-3 font-medium">Loja</th><th className="pb-3 font-medium">Pagamento</th><th className="pb-3 text-right font-medium">Valor</th></tr></thead>
        <tbody>{finance.orders.map(order => <tr key={order.id} className="border-t border-border"><td className="py-4 pr-3"><span className="font-mono">#{order.id.slice(0, 8)}</span><p className="mt-1 text-xs text-muted-foreground">{new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date(order.createdAt))}</p></td><td className="pr-3">{order.store}</td><td className="pr-3"><span className="flex items-center gap-1.5"><CheckCheck className="h-4 w-4 text-success" />{order.method}</span></td><td className="text-right font-semibold tabular-nums">{brl(order.amountCents / 100)}</td></tr>)}</tbody>
      </table></div> : <p className="py-12 text-center text-sm text-muted-foreground">Nenhum pedido com pagamento real confirmado.</p>}
      <p className="mt-4 text-xs text-muted-foreground">Testes, taxas extras e pagamentos pendentes não entram no faturamento. Datas referentes à criação do pedido.</p>
    </section>
  </div>;
}