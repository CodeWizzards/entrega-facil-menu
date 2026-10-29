import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Bike, Check, ChefHat, CircleDashed, Home, LoaderCircle, MapPin, ReceiptText, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceSheet } from "@/components/InvoiceSheet";
import { PixPaymentPanel } from "@/components/PixPaymentPanel";
import { brl, type Menu } from "@/lib/menu";
import type { PixPayment } from "@/lib/pix";
import { LIVE_LOCATION_FEE_CENTS } from "@/lib/pix";
import { checkLiveLocationPix, createLiveLocationPix } from "@/lib/pix.functions";
import { newPixAccess } from "@/lib/pix-session";
import { deliveryAddress, type DeliveryDetails } from "@/lib/checkout";
import { buildInvoice, type InvoiceDoc, type InvoiceLine } from "@/lib/invoice";

type Step = { label: string; hint: string; icon: typeof Check; state: "done" | "current" | "next" };

const LIVE_FEE = LIVE_LOCATION_FEE_CENTS / 100;

/** Rota desenhada no mapa (coordenadas do viewBox 340x190). */
const ROUTE = "M 16 146 L 96 146 Q 112 146 112 130 L 112 92 Q 112 76 128 76 L 230 76 Q 246 76 246 92 L 246 130 Q 246 146 262 146 L 306 146";
const DEST = { x: 306, y: 133 };

/**
 * Acompanhamento do pedido após o pagamento confirmado.
 * As etapas futuras ficam pendentes de verdade: quem atualiza é a loja,
 * pelo WhatsApp do cliente. Nada de distância ou posição inventada.
 *
 * A "localização ao vivo" cobra uma taxa real por Pix. O mapa é uma rota
 * fictícia: a posição real do entregador ainda não está conectada.
 */
export function OrderTracking({ menu, payment, form, total, lines, orderAccess, onClose }: {
  menu: Menu;
  payment: PixPayment;
  form: DeliveryDetails;
  total: number;
  lines: InvoiceLine[];
  orderAccess: string;
  onClose: () => void;
}) {
  const [doc, setDoc] = useState<InvoiceDoc | null>(null);
  const [showDoc, setShowDoc] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [live, setLive] = useState<"idle" | "paying" | "on">("idle");
  const [fee, setFee] = useState<PixPayment | null>(null);
  const [feeChecking, setFeeChecking] = useState(false);
  const [feeError, setFeeError] = useState("");
  const feeAccess = useRef("");
  const createFee = useServerFn(createLiveLocationPix);
  const checkFee = useServerFn(checkLiveLocationPix);

  // O Pix da taxa é conferido sozinho a cada 5 segundos, sem sobrepor consultas.
  const verifyFee = async () => {
    if (feeChecking || !feeAccess.current) return;
    setFeeChecking(true); setFeeError("");
    try {
      const result = await checkFee({ data: { access: feeAccess.current } });
      setFee(result);
      if (result.status === "PAID") setLive("on");
    } catch (error) { setFeeError(error instanceof Error ? error.message : "Não foi possível consultar o Pix."); }
    finally { setFeeChecking(false); }
  };
  const verifyFeeRef = useRef(verifyFee);
  verifyFeeRef.current = verifyFee;
  const pendingFee = live === "paying" && fee != null && !["PAID", "CANCELLED", "REFUNDED"].includes(fee.status);
  useEffect(() => {
    if (!pendingFee) return;
    const id = setInterval(() => { void verifyFeeRef.current(); }, 5000);
    return () => clearInterval(id);
  }, [pendingFee]);

  async function payLiveFee() {
    if (live === "paying") return;
    const access = newPixAccess();
    feeAccess.current = access;
    setFee(null); setFeeError(""); setLive("paying");
    try {
      const result = await createFee({ data: { access, orderAccess } });
      setFee(result);
      if (result.status === "PAID") setLive("on");
    } catch (error) {
      feeAccess.current = "";
      setFee(null); setLive("idle");
      setFeeError(error instanceof Error ? error.message : "Não foi possível gerar o Pix.");
    }
  }

  function openInvoice() {
    if (doc) { setShowDoc(true); return; }
    try {
      // O documento só sai se os itens baterem com o valor realmente pago.
      setDoc(buildInvoice({ menu, payment, form, lines }));
      setInvoiceError("");
      setShowDoc(true);
    } catch (error) {
      setInvoiceError(error instanceof Error ? error.message : "Não foi possível gerar o documento.");
    }
  }

  const liveFeeText = brl(LIVE_FEE).replace("R$", "").trim();

  const steps: Step[] = [
    { label: "Pagamento confirmado", hint: `${payment.method === "CARD" ? "Cartão" : "Pix"} aprovado · ${brl(payment.amount)}`, icon: Check, state: "done" },
    { label: "Pedido enviado à loja", hint: "Aguardando a confirmação da loja", icon: Store, state: "current" },
    { label: "Em preparo", hint: "Aguardando a loja iniciar o preparo", icon: ChefHat, state: "next" },
    { label: "Saiu para entrega", hint: "A loja avisa quando sair", icon: Bike, state: "next" },
    { label: "Entregue", hint: "Bom apetite!", icon: Home, state: "next" },
  ];
  return (
    <div className="tracking" aria-label="Acompanhamento do pedido">
      <div className="tracking-hero">
        <span className="tracking-logo"><img src={menu.logoImg} alt="" /></span>
        <div className="min-w-0">
          <p className="tracking-status">Pedido confirmado</p>
          <p className="tracking-store">{menu.store.name}</p>
          <p className="tracking-meta">Pedido {payment.orderId.slice(0, 8).toUpperCase()} · Previsão {menu.store.eta}</p>
        </div>
      </div>

      <ol className="tracking-steps">
        {steps.map(step => (
          <li key={step.label} className={`tracking-step is-${step.state}`}>
            <span className="tracking-dot" aria-hidden="true">
              {step.state === "next" ? <CircleDashed className="h-4 w-4" strokeWidth={2.2} /> : <step.icon className="h-4 w-4" strokeWidth={2.6} />}
            </span>
            <div className="min-w-0">
              <p className="tracking-step-label">{step.label}</p>
              <p className="tracking-step-hint">{step.hint}</p>
            </div>
          </li>
        ))}
      </ol>

      {live === "on" ? (
        <div className="tracking-live" aria-label="Localização ao vivo (demonstração)">
          <div className="tracking-live-map">
            <svg className="tracking-live-svg" viewBox="0 0 340 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <g className="map-blocks">
                <rect x="6" y="4" width="98" height="16" rx="8" />
                <rect x="6" y="36" width="98" height="32" rx="9" />
                <rect x="6" y="112" width="98" height="26" rx="8" />
                <rect x="6" y="158" width="98" height="26" rx="8" />
                <rect x="124" y="4" width="108" height="16" rx="8" />
                <rect x="124" y="36" width="108" height="32" rx="9" />
                <rect x="258" y="4" width="76" height="26" rx="8" />
                <rect x="258" y="38" width="76" height="30" rx="8" />
                <rect x="124" y="84" width="38" height="54" rx="9" />
                <rect x="182" y="84" width="56" height="54" rx="9" />
                <rect x="258" y="84" width="76" height="24" rx="8" />
                <rect x="124" y="158" width="38" height="26" rx="8" />
                <rect x="182" y="158" width="56" height="26" rx="8" />
              </g>
              <rect className="map-park" x="182" y="84" width="56" height="54" rx="9" />
              <g className="map-roads">
                <line x1="0" y1="146" x2="340" y2="146" className="map-road-major" />
                <line x1="90" y1="76" x2="340" y2="76" className="map-road-major" />
                <line x1="112" y1="16" x2="112" y2="190" className="map-road-minor" />
                <line x1="246" y1="0" x2="246" y2="132" className="map-road-minor" />
                <line x1="170" y1="76" x2="170" y2="190" className="map-road-minor" />
                <line x1="0" y1="104" x2="112" y2="104" className="map-road-minor" />
                <line x1="0" y1="28" x2="240" y2="28" className="map-road-minor" />
                <line x1="246" y1="120" x2="340" y2="120" className="map-road-minor" />
              </g>
              <g className="map-streets">
                <text x="300" y="70" textAnchor="middle">AV. DA BRASA</text>
                <text x="56" y="101" textAnchor="middle">R. DAS PALMEIRAS</text>
                <text x="170" y="110" textAnchor="middle" transform="rotate(-90 170 110)">R. DO FOGO</text>
                <text x="175" y="25" textAnchor="middle">R. DO MAR</text>
              </g>
              <path className="map-route" d={ROUTE} />
              <path className="map-route-flow" d={ROUTE} />
              <g className="map-dest" transform={`translate(${DEST.x} ${DEST.y})`}>
                <circle className="map-dest-halo" cx="0" cy="-4" r="17" />
                <path className="map-dest-pin" d="M 0 13 C -3.6 6.6 -10.6 3.4 -10.6 -4 A 10.6 10.6 0 1 1 10.6 -4 C 10.6 3.4 3.6 6.6 0 13 Z" />
                <circle className="map-dest-inner" cx="0" cy="-4" r="3.8" />
              </g>
              <g className="map-courier">
                <circle className="map-courier-halo" r="19" />
                <rect className="map-courier-badge" x="-12" y="-12" width="24" height="24" rx="8" />
                <g className="map-courier-glyph" transform="scale(0.62) translate(-12 -12)">
                  <circle cx="18.5" cy="17.5" r="3.5" />
                  <circle cx="5.5" cy="17.5" r="3.5" />
                  <circle cx="15" cy="5" r="1" />
                  <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
                </g>
                <animateMotion dur="9s" repeatCount="indefinite" rotate="0" path={ROUTE} />
              </g>
            </svg>
            <span className="tracking-live-chip is-live"><i aria-hidden="true" /> Ao vivo</span>
            <span className="tracking-live-chip is-demo">Demonstração</span>
          </div>

          <div className="tracking-live-rows">
            <div className="tracking-live-row">
              <span className="tracking-live-avatar" aria-hidden="true"><Bike /></span>
              <div className="min-w-0 flex-1">
                <p className="tracking-live-row-title">Rota até seu endereço</p>
                <p className="tracking-live-row-sub">Trajeto simulado para testes</p>
              </div>
              <span className="tracking-live-eta">{menu.store.eta}</span>
            </div>
            <div className="tracking-live-row is-plain">
              <span className="tracking-live-row-label">Posição real do entregador</span>
              <span className="tracking-live-row-value">ainda não conectada</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="tracking-live-cta">
          <div className="tracking-live-head">
            <span className="tracking-live-icon"><MapPin strokeWidth={2.4} /></span>
            <div className="min-w-0 flex-1">
              <p className="tracking-live-cta-title">Localização ao vivo</p>
              <p className="tracking-live-cta-sub">Acompanhe o entregador no mapa em tempo real</p>
            </div>
            <span className="tracking-live-price"><span>R$</span>{liveFeeText}</span>
          </div>
          <div className="tracking-live-flag">
            {live === "paying" && !fee
              ? <Button variant="storefront" size="storefront" className="btn-primary w-full gap-2" disabled><LoaderCircle className="h-4 w-4 animate-spin" /> Gerando Pix…</Button>
              : <Button variant="storefront" size="storefront" className="btn-primary w-full" onClick={payLiveFee}>Ativar localização ao vivo</Button>}
            {feeError && !fee && <p role="alert" className="text-xs text-destructive">{feeError}</p>}
          </div>
          {fee && <PixPaymentPanel payment={fee} checking={feeChecking} error={feeError} onCheck={verifyFee} title="Taxa de localização ao vivo" paidText="Pix recebido. Abrindo o mapa…" />}
          {fee && ["CANCELLED", "REFUNDED"].includes(fee.status) && <Button variant="storefront" size="storefront" className="mt-3 w-full rounded-full border border-border px-4 py-3 text-sm font-semibold" onClick={payLiveFee}>Gerar novo Pix</Button>}
        </div>
      )}

      <div className="tracking-card">
        <p className="tracking-card-title"><ReceiptText className="h-4 w-4" /> Resumo</p>
        <p className="text-sm text-muted-foreground">{deliveryAddress(form)}</p>
        <p className="mt-1 text-sm font-semibold">Total pago: <span className="text-primary">{brl(total)}</span></p>
      </div>

      <div className="tracking-invoice">
        <Button variant="storefront" size="storefront" className="btn-success w-full" onClick={openInvoice}>
          <span className="btn-success-icon" aria-hidden="true"><ReceiptText strokeWidth={2.2} /></span>
          <span className="btn-success-label"><span className="block font-semibold">{doc ? "Ver comprovante" : "Ver comprovante do pedido"}</span><span className="block text-xs opacity-80">Pedido pago · {brl(total)}</span></span>
          <ArrowRight className="btn-success-arrow" aria-hidden="true" />
        </Button>
        {invoiceError && <p className="tracking-invoice-error" role="alert">{invoiceError}</p>}
      </div>

      <Button variant="storefront" size="storefront" className="mt-3 w-full rounded-full border border-border px-4 py-3 text-sm font-semibold" onClick={onClose}>Voltar ao cardápio</Button>

      {doc && showDoc && <InvoiceSheet menu={menu} doc={doc} onClose={() => setShowDoc(false)} />}
    </div>
  );
}
