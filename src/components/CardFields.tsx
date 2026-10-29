import { useState } from "react";
import { cardBrand, cardErrors, formatCardExpiry, formatCardNumber, type CardBrand, type CardDetails } from "@/lib/card";

const BRAND_LABEL: Record<CardBrand, string> = { visa: "VISA", mastercard: "mastercard", amex: "AMEX", elo: "elo", hipercard: "Hipercard", unknown: "" };

function BrandMark({ brand }: { brand: CardBrand }) {
  if (brand === "mastercard") return <span className="card-brand card-brand-mc" aria-label="Mastercard"><i /><i /></span>;
  if (brand === "unknown") return <span className="card-brand card-brand-empty" aria-hidden="true" />;
  return <span key={brand} className={`card-brand card-brand-${brand}`}>{BRAND_LABEL[brand]}</span>;
}

export function CardPreview({ card, flipped, focus, brandOverride, last4 }: { card: CardDetails; flipped: boolean; focus: keyof CardDetails | null; brandOverride?: CardBrand; last4?: string }) {
  const brand = brandOverride ?? cardBrand(card.number);
  const digits = card.number.replace(/\D/g, "");
  const groups = brand === "amex" ? [4, 6, 5] : [4, 4, 4, 4];
  let i = 0;
  const shown = last4
    ? groups.map((size, g) => g === groups.length - 1 ? "•".repeat(size - last4.length) + last4 : "•".repeat(size))
    : groups.map(size => Array.from({ length: size }, () => digits[i++] ?? "•").join(""));
  return (
    <div className="card-stage" aria-hidden="true">
      <div className={`card-3d ${flipped ? "is-flipped" : ""}`} data-brand={brand}>
        <div className="card-face card-front">
          <div className="card-shine" />
          <div className="flex items-start justify-between">
            <span className="card-chip"><i /><i /><i /></span>
            <BrandMark brand={brand} />
          </div>
          <div className={`card-number ${focus === "number" ? "is-focus" : ""}`}>
            {shown.map((group, g) => <span key={g}>{[...group].map((c, k) => <b key={`${k}-${c}`} className={c === "•" ? "is-empty" : "is-typed"}>{c}</b>)}</span>)}
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className={`card-meta min-w-0 flex-1 ${focus === "owner" ? "is-focus" : ""}`}><small>Titular</small><span className="truncate">{card.owner.trim().toUpperCase() || "NOME COMO NO CARTÃO"}</span></div>
            <div className={`card-meta text-right ${focus === "expiresAt" ? "is-focus" : ""}`}><small>Validade</small><span>{card.expiresAt || "MM/AA"}</span></div>
          </div>
        </div>
        <div className="card-face card-back">
          <div className="card-stripe" />
          <div className="card-sign"><span className="card-sign-lines" /><span className="card-cvv">{card.cvv ? "•".repeat(card.cvv.length) : "CVV"}</span></div>
          <div className="flex items-center justify-between px-5"><span className="text-[10px] tracking-widest opacity-70">CÓDIGO DE SEGURANÇA</span><BrandMark brand={brand} /></div>
        </div>
      </div>
    </div>
  );
}

export function CardFields({ card, onChange, submitted }: { card: CardDetails; onChange: (card: CardDetails) => void; submitted: boolean }) {
  const errors = cardErrors(card);
  const [focus, setFocus] = useState<keyof CardDetails | null>(null);
  const field = (key: keyof CardDetails, label: string, autocomplete: string, placeholder: string) => <label className="checkout-field"><span>{label}</span><input className="field" aria-label={label} placeholder={placeholder} autoComplete={autocomplete} type={key === "cvv" ? "password" : "text"} inputMode={key === "owner" ? "text" : "numeric"} value={card[key]} maxLength={key === "number" ? 24 : key === "expiresAt" ? 5 : key === "cvv" ? 4 : 200} aria-invalid={submitted && Boolean(errors[key])} onFocus={() => setFocus(key)} onBlur={() => setFocus(f => (f === key ? null : f))} onChange={e => onChange({ ...card, [key]: key === "number" ? formatCardNumber(e.target.value) : key === "expiresAt" ? formatCardExpiry(e.target.value) : key === "cvv" ? e.target.value.replace(/\D/g, "").slice(0, 4) : e.target.value })} />{submitted && errors[key] && <span className="text-xs text-destructive">{errors[key]}</span>}</label>;
  return <div className="mt-4 grid gap-3"><CardPreview card={card} flipped={focus === "cvv"} focus={focus} />{field("number", "Número do cartão", "cc-number", "0000 0000 0000 0000")}{field("owner", "Titular do cartão", "cc-name", "Como está impresso no cartão")}<div className="grid grid-cols-2 gap-3">{field("expiresAt", "Validade MM/AA", "cc-exp", "MM/AA")}{field("cvv", "Código de segurança", "cc-csc", "CVV")}</div></div>;
}
