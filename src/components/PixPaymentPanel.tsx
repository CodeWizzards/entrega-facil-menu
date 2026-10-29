import { useEffect, useRef, useState } from "react";
import { Check, Copy, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/menu";
import type { PixPayment } from "@/lib/pix";

export function PixPaymentPanel({ payment, checking, error, onCheck, title = "Seu Pix", paidText = "Pix recebido. Envie o pedido à loja abaixo." }: { payment: PixPayment; checking: boolean; error: string; onCheck: () => void; title?: string; paidText?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [copyError, setCopyError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    import("qrcode").then(async qr => {
      if (!cancelled && canvas.current) await qr.toCanvas(canvas.current, payment.code, { width: 240, margin: 3, errorCorrectionLevel: "M" });
    }).catch(() => { if (!cancelled) setQrError(true); });
    return () => { cancelled = true; };
  }, [payment.code]);
  const paid = payment.status === "PAID";
  const unavailable = ["CANCELLED", "REFUNDED"].includes(payment.status);
  return <section className="checkout-section" aria-label="Pagamento Pix">
    <div className="flex items-center justify-between gap-3"><h4><ShieldCheck /> {paid ? "Pagamento confirmado" : title}</h4><span className="font-bold text-primary">{brl(payment.amount)}</span></div>
    <p role="status" className={paid ? "text-sm text-success" : "text-sm text-muted-foreground"}>{paid ? paidText : payment.status === "CANCELLED" ? "Cobrança cancelada ou expirada. Não pague este código." : payment.status === "REFUNDED" ? "Pagamento reembolsado." : "Aguardando pagamento"}</p>
    {!paid && !unavailable && <>
      <div className="mx-auto my-5 w-fit max-w-full overflow-hidden rounded-lg"><canvas ref={canvas} aria-label="QR Code para pagamento Pix" className="block h-60 w-60 max-w-full" /></div>
      {qrError && <p className="mb-3 text-xs text-destructive">Não foi possível exibir o QR Code. Use o código abaixo.</p>}
      <label className="checkout-field"><span>Pix copia e cola</span><textarea readOnly value={payment.code} rows={3} className="field resize-none break-all font-mono text-xs" aria-label="Pix copia e cola" /></label>
      <Button variant="storefront" size="storefront" className="btn-primary mt-3 flex w-full items-center justify-center gap-2" onClick={async () => {
        try { await navigator.clipboard.writeText(payment.code); setCopied(true); setCopyError(false); }
        catch { setCopyError(true); }
      }}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Código copiado" : "Copiar código Pix"}</Button>
      {copyError && <p role="alert" className="mt-2 text-xs text-destructive">Selecione e copie o código no campo acima.</p>}
    </>}
    <Button variant="storefront" size="storefront" disabled={checking} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-3 text-sm font-semibold" onClick={onCheck}>{checking ? <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <RefreshCw className="h-4 w-4" />}{checking ? "Consultando pagamento…" : "Verificar pagamento"}</Button>
    {error && <p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}
  </section>;
}