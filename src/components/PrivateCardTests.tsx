import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readCardTests } from "@/lib/private-access.functions";
import { brl } from "@/lib/menu";

type Row = { id: string; created_at: string; menu_path: string; amount_cents: number; details: string };
type Details = { form?: Partial<Record<"name"|"phone"|"email"|"cpf"|"street"|"number"|"complement"|"neighborhood"|"city"|"state"|"cep", string>>; items?: { qty: number; name: string }[]; card?: { brand: string; last4: string; owner: string; expiresAt: string; cvvInformed: boolean } };

export function PrivateCardTests() {
  const read = useServerFn(readCardTests);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const load = () => { setError(""); void read().then(setRows).catch(() => setError("Não foi possível carregar os testes de cartão.")); };
  useEffect(load, []);
  return <section className="mt-10 border-t border-border pt-8">
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-semibold"><CreditCard className="h-5 w-5 text-primary" />Cartão em teste · dados recebidos</h2>
      <Button variant="outline" size="sm" className="rounded-full" onClick={load}><RefreshCw />Atualizar</Button>
    </div>
    <p className="mt-2 text-sm text-muted-foreground">Nenhuma cobrança é feita. Número completo e CVV não são guardados.</p>
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    {rows?.length === 0 && <p className="mt-4 text-sm text-muted-foreground">Nenhum teste recebido ainda.</p>}
    <div className="mt-4 grid gap-3">
      {rows?.map(r => {
        const d = JSON.parse(r.details) as Details;
        const f = d.form ?? {};
        return <article key={r.id} className="rounded-2xl bg-secondary p-4 text-sm">
          <div className="flex flex-wrap justify-between gap-2 font-semibold"><span>{new Date(r.created_at).toLocaleString("pt-BR")} · {r.menu_path === "/sushi" ? "Sushi" : "Lanches"}</span><span>{brl(r.amount_cents / 100)}</span></div>
          <p className="mt-2">Cartão: {d.card?.brand} •••• {d.card?.last4} · {d.card?.owner} · validade {d.card?.expiresAt} · CVV {d.card?.cvvInformed ? "informado" : "não informado"}</p>
          <p className="mt-1 text-muted-foreground">{f.name} · {f.phone} · {f.email} · CPF {f.cpf}</p>
          <p className="mt-1 text-muted-foreground">{[f.street, f.number, f.complement, f.neighborhood, f.city, f.state, f.cep].filter(Boolean).join(", ")}</p>
          <p className="mt-1 text-muted-foreground">{d.items?.map(i => `${i.qty}x ${i.name}`).join(", ")}</p>
        </article>;
      })}
    </div>
  </section>;
}
