import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cardBrand, cardErrors, emptyCard, formatCardExpiry, formatCardNumber } from "@/lib/card";

const brandNames = { visa: "Visa", mastercard: "Mastercard", amex: "American Express", elo: "Elo", hipercard: "Hipercard", unknown: "Não identificada" };

// Local-only validator: nothing is sent, stored or shown in full (no PAN/CVV echo).
export function PrivateCardTest({ variant = "panel" }: { variant?: "panel" | "checkout" }) {
  const [card, setCard] = useState(emptyCard);
  const [result, setResult] = useState<{ ok: boolean; brand: string; last4: string; errors: string[] } | null>(null);
  const checkout = variant === "checkout";
  const set = (key: keyof typeof card, value: string) => setCard(c => ({ ...c, [key]: value }));
  return <section className={checkout ? "card-test-checkout" : "mt-10 border-t border-border pt-8"}>
    <h2 className="flex items-center gap-2 font-semibold"><CreditCard className="h-5 w-5 text-primary" />Teste de cartão</h2>
    <p className="mt-1 text-sm text-muted-foreground">Valida número, validade e CVV só neste navegador. Nada é enviado nem cobrado.</p>
    <form className={checkout ? "mt-4 grid gap-3" : "mt-5 grid max-w-xl gap-3 sm:grid-cols-2"} onSubmit={e => {
      e.preventDefault();
      const errors = Object.values(cardErrors(card)).filter(Boolean) as string[];
      const digits = card.number.replace(/\D/g, "");
      setResult({ ok: errors.length === 0, brand: brandNames[cardBrand(digits)], last4: digits.slice(-4), errors });
      setCard(emptyCard);
    }}>
      <Input className={checkout ? "field" : "sm:col-span-2"} placeholder="Nome do titular" autoComplete="off" value={card.owner} onChange={e => set("owner", e.target.value)} />
      <Input className={checkout ? "field" : "sm:col-span-2"} placeholder="Número do cartão" inputMode="numeric" autoComplete="off" value={card.number} onChange={e => set("number", formatCardNumber(e.target.value))} />
      <div className={checkout ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-3 sm:col-span-2"}>
        <Input placeholder="MM/AA" inputMode="numeric" autoComplete="off" value={card.expiresAt} onChange={e => set("expiresAt", formatCardExpiry(e.target.value))} />
        <Input placeholder="CVV" inputMode="numeric" type="password" autoComplete="off" value={card.cvv} onChange={e => set("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))} />
      </div>
      <Button type="submit" className={checkout ? "rounded-full w-full" : "rounded-full sm:col-span-2 sm:justify-self-start"}>Validar cartão</Button>
    </form>
    {result && <div className={checkout ? "mt-3 rounded-lg border border-border bg-card p-4 text-sm" : "mt-4 max-w-xl rounded-lg border border-border bg-card p-4 text-sm"}>
      <p className={result.ok ? "font-semibold text-success" : "font-semibold text-destructive"}>{result.ok ? "Cartão válido" : "Cartão inválido"}</p>
      <p className="mt-1 text-muted-foreground">{result.brand}{result.last4 && ` · final ${result.last4}`}</p>
      {result.errors.map(err => <p key={err} className="mt-1 text-xs text-destructive">{err}</p>)}
    </div>}
  </section>;
}
