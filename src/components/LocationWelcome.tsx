import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, MapPin, LocateFixed, LoaderCircle, Check, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lookupPostal } from "@/lib/postal";
import { UFS, placeFromCoords } from "@/lib/place";
import type { Menu } from "@/lib/menu";

export function LocationWelcome({ menu }: { menu: Menu }) {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState<"state" | "city" | "result">("state");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [cep, setCep] = useState("");
  const [busy, setBusy] = useState<"gps" | "postal" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const autoTried = useRef(false);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    setCities([]);
    if (!state) return;
    const controller = new AbortController();
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((rows: { nome: string }[]) => setCities(rows.map(row => row.nome)))
      .catch(() => {});
    return () => controller.abort();
  }, [state]);

  function stopLookup() {
    request.current?.abort();
    setBusy(null);
    setFeedback("");
  }

  async function detect() {
    if (!navigator.geolocation) {
      setFeedback("Informe seu CEP ou escolha o estado.");
      return;
    }
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy("gps");
    setFeedback("");
    const timeout = setTimeout(() => {
      controller.abort();
      setBusy(null);
      setFeedback("A localização está demorando. Você pode usar seu CEP ou escolher o estado.");
    }, 8000);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 7000, maximumAge: 300000, enableHighAccuracy: false }),
      );
      if (controller.signal.aborted) return;
      const place = await placeFromCoords(position.coords.latitude, position.coords.longitude, controller.signal);
      if (controller.signal.aborted) return;
      setState(place.state);
      setCity(place.city);
      setStep("city");
    } catch (error) {
      if (controller.signal.aborted) return;
      const denied = typeof error === "object" && error !== null && "code" in error && error.code === 1;
      setFeedback(denied ? "Sem acesso à localização. Use seu CEP ou escolha o estado." : "Não foi possível localizar você. Use seu CEP ou escolha o estado.");
    } finally {
      clearTimeout(timeout);
      if (!controller.signal.aborted) setBusy(null);
    }
  }

  useEffect(() => {
    if (!autoTried.current) {
      autoTried.current = true;
      void detect();
    }
    return () => request.current?.abort();
  }, []);

  async function postal() {
    stopLookup();
    const controller = new AbortController();
    request.current = controller;
    setBusy("postal");
    try {
      const address = await lookupPostal(cep, controller.signal);
      if (controller.signal.aborted) return;
      setState(address.state);
      setCity(address.city);
      setStep("city");
    } catch (error) {
      if (!controller.signal.aborted) setFeedback(error instanceof Error ? error.message : "Não foi possível consultar o CEP.");
    } finally {
      if (!controller.signal.aborted) setBusy(null);
    }
  }

  function changeOpen(value: boolean) {
    if (!value) stopLookup();
    setOpen(value);
  }

  return <Dialog.Root open={open} onOpenChange={changeOpen}>
    <Dialog.Overlay className="sheet-backdrop location-backdrop" />
    <Dialog.Content className="location-modal" aria-describedby="location-description">
      <div className="location-toolbar">
        {step !== "state" ? <Button variant="storefront" size="storefront" className="icon-btn" aria-label="Voltar localização" onClick={() => { stopLookup(); setStep(step === "result" ? "city" : "state"); }}><ArrowLeft /></Button> : <span className="location-toolbar-spacer" />}
        <div className="location-progress" aria-label={`Etapa ${step === "state" ? 1 : step === "city" ? 2 : 3} de 3`}><span className="on" /><span className={step !== "state" ? "on" : ""} /><span className={step === "result" ? "on" : ""} /></div>
        <Button variant="storefront" size="storefront" className="icon-btn" aria-label="Fechar localização" onClick={() => changeOpen(false)}><X /></Button>
      </div>
      <div className="location-step" key={step}>
        <div className={`location-art ${step === "result" ? "location-art-result" : ""}`}>
          <img src={menu.cover} alt={menu.coverAlt} width={420} height={200} />
          <div className="location-art-shade" />
          <div className="location-emblem">{step === "result" ? <><img src={menu.logoImg} alt="" /><span className="location-confirmed"><Check /></span></> : <MapPin />}</div>
        </div>
        <div className="location-body">
          <p className="location-eyebrow">{step === "result" ? "LOCALIZAÇÃO SELECIONADA" : "SEU DELIVERY COMEÇA AQUI"}</p>
          <Dialog.Title className="location-title">{step === "state" ? "Procure o delivery mais próximo de você" : step === "city" ? "Estamos quase lá" : "Tudo pronto para escolher?"}</Dialog.Title>
          <p id="location-description" className="location-description">{step === "state" ? "Onde você quer receber seu pedido?" : step === "city" ? "Confirme a cidade para continuar." : "Seu próximo pedido começa na Casa Brasa."}</p>

          {step === "state" && <div className="location-form">
            <Button variant="storefront" size="storefront" className="location-detect" disabled={busy === "gps"} onClick={() => void detect()}><span className="location-control-icon">{busy === "gps" ? <LoaderCircle className="animate-spin" /> : <LocateFixed />}</span><span>{busy === "gps" ? "Localizando você…" : "Usar minha localização"}<small>{busy === "gps" ? "Você também pode preencher abaixo" : "Estado e cidade automaticamente"}</small></span>{busy !== "gps" && <ArrowRight />}</Button>
            <div className="location-divider"><span />ou informe seu local<span /></div>
            <div className="location-postal"><input aria-label="CEP para localização" className="field" placeholder="Seu CEP" inputMode="numeric" autoComplete="postal-code" maxLength={9} value={cep} onChange={e => { stopLookup(); setCep(e.target.value); }} /><Button variant="storefront" size="storefront" className="location-postal-btn" aria-label="Buscar CEP" disabled={busy === "postal" || cep.replace(/\D/g, "").length !== 8} onClick={() => void postal()}>{busy === "postal" ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}</Button></div>
            <label className="checkout-field">Estado<div className="location-select"><select className="field" aria-label="Estado" value={state} onChange={e => { stopLookup(); setState(e.target.value); setCity(""); }}><option value="">Selecione seu estado</option>{UFS.map(uf => <option key={uf}>{uf}</option>)}</select><ChevronDown /></div></label>
            <Button variant="storefront" size="storefront" className="btn-primary location-primary" disabled={!state} onClick={() => { stopLookup(); setStep("city"); }}>Continuar <ArrowRight /></Button>
          </div>}
          {step === "city" && <div className="location-form"><div className="location-region"><MapPin /><span>Seu estado<strong>{state}</strong></span><Button variant="storefront" size="storefront" className="location-edit" onClick={() => { stopLookup(); setStep("state"); }}>Alterar</Button></div><label className="checkout-field">Cidade<input className="field" aria-label="Cidade" list="location-cities" autoComplete="address-level2" placeholder="Nome da sua cidade" value={city} onChange={e => { stopLookup(); setCity(e.target.value); }} /><datalist id="location-cities">{cities.map(c => <option key={c} value={c} />)}</datalist></label><Button variant="storefront" size="storefront" className="btn-primary location-primary" disabled={!city.trim()} onClick={() => { stopLookup(); setStep("result"); }}>Confirmar localização <ArrowRight /></Button></div>}
          {step === "result" && <div className="location-form"><div className="location-destination"><MapPin /><div><span>Você está em</span><strong>{city}, {state}</strong></div><Button variant="storefront" size="storefront" className="location-edit" aria-label="Alterar cidade" onClick={() => setStep("city")}>Alterar</Button></div><div className="location-store"><strong>{menu.store.name}</strong><span>Entrega grátis</span></div><p className="location-coverage">Disponibilidade de entrega a confirmar.</p><Button variant="storefront" size="storefront" className="btn-primary location-primary" onClick={() => changeOpen(false)}>Ver cardápio <ArrowRight /></Button></div>}
          {feedback && <p role="status" className="location-feedback">{feedback}</p>}
        </div>
      </div>
    </Dialog.Content>
  </Dialog.Root>;
}