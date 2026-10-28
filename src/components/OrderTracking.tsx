import { useEffect, useRef, useState } from "react";
import { Bike, Check, ChefHat, CircleDashed, Home, LoaderCircle, MapPin, MessageCircle, Navigation, ReceiptText, SendHorizontal, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brl, type Menu } from "@/lib/menu";
import type { PixPayment } from "@/lib/pix";
import { deliveryAddress, type DeliveryDetails } from "@/lib/checkout";

type Step = { label: string; hint: string; icon: typeof Check; state: "done" | "current" | "next" };

const LIVE_FEE = 7.32;

/**
 * Acompanhamento do pedido após o pagamento confirmado.
 * As etapas futuras ficam pendentes de verdade: quem atualiza é a loja,
 * pelo WhatsApp do cliente. Nada de distância ou posição inventada.
 *
 * A "localização ao vivo" é uma demonstração de teste: a taxa é simulada
 * no navegador, sem cobrança real, e o mapa não mostra posição verdadeira.
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
            <span className="tracking-live-pin"><Navigation /></span>
            <span className="tracking-live-pulse" aria-hidden="true" />
          </div>
          <p className="tracking-live-title">Localização ao vivo ativada</p>
          <p className="tracking-live-hint">Demonstração de teste — a posição real do entregador ainda não está conectada.</p>
        </div>
      ) : (
        <div className="tracking-live-cta">
          <div className="tracking-live-head">
            <span className="tracking-live-icon"><MapPin strokeWidth={2.4} /></span>
            <div className="min-w-0 flex-1">
              <p className="tracking-live-cta-title">Localização ao vivo</p>
              <p className="tracking-live-cta-sub">Acompanhe o entregador no mapa em tempo real</p>
            </div>
            <span className="tracking-live-price">{brl(LIVE_FEE)}</span>
          </div>
          <span className="test-badge">TESTE · NÃO PAGAR</span>
          <Button variant="storefront" size="storefront" className="btn-primary w-full gap-2" disabled={live === "paying"} onClick={payLiveFee}>
            {live === "paying" ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Processando pagamento de teste…</> : <>Ativar localização ao vivo · {brl(LIVE_FEE)}</>}
          </Button>
          <p className="tracking-live-disclaimer">Cobrança simulada para testes. Nenhum valor é debitado.</p>
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
