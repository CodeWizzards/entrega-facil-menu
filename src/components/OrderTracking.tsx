import { useEffect, useRef, useState } from "react";
import { Bike, Check, ChefHat, CircleDashed, Home, LoaderCircle, MapPin, MessageCircle, ReceiptText, SendHorizontal, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brl, type Menu } from "@/lib/menu";
import type { PixPayment } from "@/lib/pix";
import { deliveryAddress, type DeliveryDetails } from "@/lib/checkout";

type Step = { label: string; hint: string; icon: typeof Check; state: "done" | "current" | "next" };

const LIVE_FEE = 7.32;

/** Rota desenhada no mapa (coordenadas do viewBox 340x190). */
const ROUTE = "M 12 146 L 92 146 Q 112 146 112 126 L 112 96 Q 112 76 132 76 L 226 76 Q 246 76 246 56 L 246 26";
const DEST = { x: 246, y: 26 };

/**
 * Acompanhamento do pedido após o pagamento confirmado.
 * As etapas futuras ficam pendentes de verdade: quem atualiza é a loja,
 * pelo WhatsApp do cliente. Nada de distância ou posição inventada.
 *
 * A "localização ao vivo" é uma demonstração de teste: a taxa é simulada
 * no navegador, sem cobrança real, e o mapa mostra uma rota fictícia.
 */
export function OrderTracking({ menu, payment, form, total, sentToStore, onSend, onClose }: {
  menu: Menu;
  payment: PixPayment;
  form: DeliveryDetails;
  total: number;
  sentToStore: boolean;
  onSend: () => void;
  onClose: () => void;
}) {
  const [live, setLive] = useState<"idle" | "paying" | "on">("idle");
  const liveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (liveTimer.current) clearTimeout(liveTimer.current); }, []);

  function payLiveFee() {
    // Simulação de teste: nenhuma cobrança real é criada.
    setLive("paying");
    liveTimer.current = setTimeout(() => setLive("on"), 1800);
  }

  const liveFeeText = brl(LIVE_FEE).replace("R$", "").trim();

  const steps: Step[] = [
    { label: "Pagamento confirmado", hint: `${payment.method === "CARD" ? "Cartão" : "Pix"} aprovado · ${brl(payment.amount)}`, icon: Check, state: "done" },
    { label: "Pedido enviado à loja", hint: sentToStore ? "A loja recebeu seu pedido" : "Toque no botão abaixo para enviar", icon: Store, state: sentToStore ? "done" : "current" },
    { label: "Em preparo", hint: "A loja confirma pelo WhatsApp", icon: ChefHat, state: "next" },
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
                <rect x="6" y="4" width="100" height="16" rx="8" />
                <rect x="6" y="36" width="100" height="32" rx="9" />
                <rect x="6" y="112" width="100" height="26" rx="8" />
                <rect x="124" y="8" width="110" height="60" rx="11" />
                <rect x="258" y="8" width="76" height="60" rx="11" />
                <rect x="124" y="84" width="38" height="54" rx="9" />
                <rect x="182" y="84" width="56" height="54" rx="9" />
                <rect x="258" y="84" width="76" height="54" rx="9" />
                <rect x="124" y="158" width="38" height="26" rx="8" />
                <rect x="182" y="158" width="56" height="26" rx="8" />
                <rect x="258" y="158" width="76" height="26" rx="8" />
              </g>
              <g className="map-roads">
                <line x1="0" y1="146" x2="340" y2="146" className="map-road-major" />
                <line x1="90" y1="76" x2="340" y2="76" className="map-road-major" />
                <line x1="112" y1="20" x2="112" y2="190" className="map-road-minor" />
                <line x1="246" y1="0" x2="246" y2="120" className="map-road-minor" />
                <line x1="170" y1="76" x2="170" y2="190" className="map-road-minor" />
                <line x1="0" y1="104" x2="112" y2="104" className="map-road-minor" />
                <line x1="0" y1="28" x2="106" y2="28" className="map-road-minor" />
              </g>
              <path className="map-route" d={ROUTE} />
              <path className="map-route-flow" d={ROUTE} />
              <g className="map-dest" transform={`translate(${DEST.x} ${DEST.y})`}>
                <circle className="map-dest-halo" r="17" />
                <circle className="map-dest-dot" r="11" />
                <path className="map-dest-glyph" d="M -4.6 3 L -4.6 -1 L 0 -5 L 4.6 -1 L 4.6 3 Z" />
              </g>
              <g className="map-courier">
                <circle className="map-courier-halo" r="15" />
                <circle className="map-courier-dot" r="9" />
                <path className="map-courier-glyph" d="M 3.6 0 L -2.4 -3.2 L -2.4 3.2 Z" />
                <animateMotion dur="9s" repeatCount="indefinite" rotate="auto" path={ROUTE} />
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
          <span className="test-badge"><i aria-hidden="true" /> Teste · não pagar</span>
          <Button variant="storefront" size="storefront" className="btn-primary w-full gap-2" disabled={live === "paying"} onClick={payLiveFee}>
            {live === "paying" ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Processando pagamento de teste…</> : <>Ativar localização ao vivo</>}
          </Button>
          <p className="tracking-live-disclaimer">Cobrança simulada. Nenhum valor é debitado.</p>
        </div>
      )}

      <div className="tracking-card">
        <p className="tracking-card-title"><ReceiptText className="h-4 w-4" /> Resumo</p>
        <p className="text-sm text-muted-foreground">{deliveryAddress(form)}</p>
        <p className="mt-1 text-sm font-semibold">Total pago: <span className="text-primary">{brl(total)}</span></p>
      </div>

      {!sentToStore && payment.whatsappMessage && (
        <Button variant="storefront" size="storefront" className="btn-primary mt-4 w-full gap-2" onClick={onSend}>
          Enviar pedido à loja <SendHorizontal className="h-4 w-4" strokeWidth={2.4} />
        </Button>
      )}
      {sentToStore && (
        <p className="tracking-note" role="status"><MessageCircle className="h-4 w-4 shrink-0" /> A loja acompanha cada etapa e te atualiza pelo seu WhatsApp.</p>
      )}
      <Button variant="storefront" size="storefront" className="mt-3 w-full rounded-full border border-border px-4 py-3 text-sm font-semibold" onClick={onClose}>Voltar ao cardápio</Button>
    </div>
  );
}
