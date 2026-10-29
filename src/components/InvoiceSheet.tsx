import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Copy, MapPin, Printer, ReceiptText, ShoppingBag, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { invoiceText, money, type InvoiceDoc } from "@/lib/invoice";
import type { Menu } from "@/lib/menu";

/**
 * Comprovante do pedido pago, com itens, dados de entrega e total.
 */
export function InvoiceSheet({ menu, doc, onClose }: { menu: Menu; doc: InvoiceDoc; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const issued = doc.issuedAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(invoiceText(doc));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-backdrop" />
        <Dialog.Content className="sheet sheet-invoice" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">Comprovante do pedido</Dialog.Title>
          <div className="sheet-grabber" />

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="invoice-launch-icon" aria-hidden="true"><ReceiptText strokeWidth={2.2} /></span>
              <div className="min-w-0">
                <h3 className="font-display text-2xl font-semibold">Comprovante do pedido</h3>
              </div>
            </div>
            <Button variant="storefront" size="storefront" aria-label="Fechar" onClick={onClose} className="icon-btn">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <article className="invoice-doc">
            <header className="invoice-doc-head">
              <span className="invoice-doc-logo"><img src={menu.logoImg} alt="" /></span>
              <div className="min-w-0">
                <p className="invoice-doc-issuer">{doc.issuer.name}</p>
                <p className="invoice-doc-tagline">{doc.issuer.tagline}</p>
              </div>
              <span className="invoice-doc-number">{doc.number}</span>
            </header>

            <dl className="invoice-meta">
              <div><dt>Emissão</dt><dd>{issued}</dd></div>
              <div><dt>Pagamento</dt><dd>{doc.method}</dd></div>
              <div><dt>Pedido</dt><dd>{doc.orderId.slice(0, 8).toUpperCase()}</dd></div>
              <div><dt>Entrega</dt><dd>{menu.store.eta}</dd></div>
            </dl>

            <section className="invoice-block">
              <p className="invoice-block-title">
                <span className="invoice-chip" aria-hidden="true"><User /></span> Comprador
              </p>
              <p className="invoice-block-line">{doc.buyer.name}</p>
              <p className="invoice-block-sub">CPF {doc.buyer.cpf} · {doc.buyer.email}</p>
              <p className="invoice-block-sub">WhatsApp {doc.buyer.phone}</p>
            </section>

            <section className="invoice-block">
              <p className="invoice-block-title">
                <span className="invoice-chip" aria-hidden="true"><MapPin /></span> Entrega
              </p>
              <p className="invoice-block-line">{doc.address}</p>
            </section>

            <section className="invoice-block">
              <p className="invoice-block-title">
                <span className="invoice-chip" aria-hidden="true"><ShoppingBag /></span> Itens
              </p>
              <ul className="invoice-lines">
                {doc.lines.map((line, index) => (
                  <li key={`${line.name}-${index}`} className="invoice-line">
                    <div className="flex min-w-0 items-center gap-3">
                      {line.image && <img src={line.image} alt="" className="invoice-line-img" />}
                      <div className="min-w-0">
                        <p className="invoice-line-name">{line.qty}x {line.name}</p>
                        {line.addons.length > 0 && <p className="invoice-line-sub">{line.addons.join(", ")}</p>}
                        {line.note && <p className="invoice-line-sub">Obs: {line.note}</p>}
                      </div>
                    </div>
                    <div className="invoice-line-values">
                      <p className="invoice-line-total">{money(line.unitCents * line.qty)}</p>
                      <p className="invoice-line-sub">{money(line.unitCents)} un.</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <dl className="invoice-totals">
              <div><dt>Subtotal</dt><dd>{money(doc.subtotalCents)}</dd></div>
              <div><dt>Entrega</dt><dd>{doc.deliveryCents ? money(doc.deliveryCents) : "Grátis"}</dd></div>
              <div className="is-total"><dt>Total pago</dt><dd>{money(doc.totalCents)}</dd></div>
            </dl>


          </article>

          <div className="sheet-actions mt-5 grid gap-2.5">
            <Button variant="storefront" size="storefront" className="btn-primary w-full gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" strokeWidth={2.4} /> Salvar em PDF
            </Button>
            <Button variant="storefront" size="storefront" className="invoice-copy w-full gap-2" onClick={copySummary}>
              {copied ? <><Check className="h-4 w-4" strokeWidth={2.6} /> Resumo copiado</> : <><Copy className="h-4 w-4" strokeWidth={2.4} /> Copiar resumo</>}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
