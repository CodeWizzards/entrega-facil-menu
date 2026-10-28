import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, MapPin, LocateFixed, LoaderCircle, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lookupPostal } from "@/lib/postal";
import { UFS, placeFromCoords } from "@/lib/place";
import { placeFromIp, rememberPlace, rememberedPlace } from "@/lib/ip-place";
import { formatCep } from "@/lib/format";
import verifiedBadge from "@/assets/verified-badge.png.asset.json";
import type { Menu } from "@/lib/menu";

export function LocationWelcome({ menu }: { menu: Menu }) {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState<"ip" | "unavailable" | "state" | "city" | "result">("ip");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [cep, setCep] = useState("");
  const [busy, setBusy] = useState<"ip" | "gps" | "postal" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const request = useRef<AbortController | null>(null);

  function confirmCity() {
    stopLookup();
    setStep("result");
  }

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
      if (controller.signal.aborted) return;
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

  function detectIp() {
    stopLookup();
    const saved = rememberedPlace();
    if (saved) {
      setState(saved.state);
      setCity(saved.city);
      setStep("result");
      return;
    }
    setStep("ip");
    const controller = new AbortController();
    request.current = controller;
    setBusy("ip");
    void placeFromIp(controller.signal).then(place => {
      if (controller.signal.aborted) return;
      setState(place.state);
      setCity(place.city);
      setStep("result");
    }).catch(() => {
      if (!controller.signal.aborted) setStep("unavailable");
    }).finally(() => {
      if (!controller.signal.aborted) setBusy(null);
    });
  }

  useEffect(() => {
    detectIp();
    return () => { request.current?.abort(); };
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
        {(step === "city" || step === "result") ? <Button variant="storefront" size="storefront" className="icon-btn" aria-label="Voltar localização" onClick={() => { stopLookup(); setStep(step === "result" ? "city" : "state"); }}><ArrowLeft /></Button> : <span className="location-toolbar-spacer" />}
        <div className="location-progress" aria-label={`Etapa ${step === "state" ? 1 : step === "city" ? 2 : 3} de 3`}><span className="on" /><span className={step !== "state" ? "on" : ""} /><span className={step === "result" ? "on" : ""} /></div>
        <Button variant="storefront" size="storefront" className="icon-btn" aria-label="Fechar localização" onClick={() => changeOpen(false)}><X /></Button>
      </div>
      <div className="location-step" key={step}>
        <div className={`location-art ${step === "result" ? "location-art-result" : ""}`}>
          <img src={menu.cover} alt={menu.coverAlt} width={420} height={200} />
          <div className="location-art-shade" />
          <div className="location-emblem">{step === "result" ? <><img src={menu.logoImg} alt="" /><img src={verifiedBadge.url} alt="Loja verificada" className="location-verified" /></> : <MapPin />}</div>
        </div>
        <div className="location-body">
          <p className="location-eyebrow">{step === "result" ? "LOCALIZAÇÃO SELECIONADA" : step === "ip" || step === "unavailable" ? "LOCALIZAÇÃO AUTOMÁTICA" : "SEU DELIVERY COMEÇA AQUI"}</p>
          <Dialog.Title className="location-title">{step === "ip" ? "Identificando sua região" : step === "unavailable" ? "Não conseguimos localizar você" : step === "state" ? "Informe sua localização" : step === "city" ? "Estamos quase lá" : "Tudo pronto para escolher?"}</Dialog.Title>
          <p id="location-description" className="location-description">{step === "ip" ? "Buscando cidade e estado pelo IP." : step === "unavailable" ? "Sua conexão não informou uma cidade válida." : step === "state" ? "Onde você quer receber seu pedido?" : step === "city" ? "Confirme a cidade para continuar." : "Seu próximo pedido começa na Casa Brasa."}</p>

          {step === "ip" && <div className="location-loading" role="status"><LoaderCircle className="animate-spin" /><Button variant="storefront" size="storefront" className="location-edit" onClick={() => { stopLookup(); setStep("state"); }}>Informar minha cidade</Button></div>}
          {step === "unavailable" && <div className="location-form"><Button variant="storefront" size="storefront" className="btn-primary location-primary" onClick={detectIp}>Tentar novamente <ArrowRight /></Button><Button variant="storefront" size="storefront" className="location-edit" onClick={() => { stopLookup(); setStep("state"); }}>Informar minha cidade</Button></div>}
          {step === "state" && <div className="location-form">
            {busy === "ip" && <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />Identificando sua região pelo IP…</p>}
            <Button variant="storefront" size="storefront" className="location-detect" disabled={busy === "gps"} onClick={() => void detect()}><span className="location-control-icon">{busy === "gps" ? <LoaderCircle className="animate-spin" /> : <LocateFixed />}</span><span>{busy === "gps" ? "Localizando você…" : "Usar minha localização"}<small>{busy === "gps" ? "Você também pode preencher abaixo" : "Estado e cidade automaticamente"}</small></span>{busy !== "gps" && <ArrowRight />}</Button>
            <div className="location-divider"><span />ou informe seu local<span /></div>
            <div className="location-postal"><input aria-label="CEP para localização" className="field" placeholder="Seu CEP" inputMode="numeric" autoComplete="postal-code" maxLength={9} value={cep} onChange={e => { stopLookup(); setCep(formatCep(e.target.value)); }} /><Button variant="storefront" size="storefront" className="location-postal-btn" aria-label="Buscar CEP" disabled={busy === "postal" || cep.replace(/\D/g, "").length !== 8} onClick={() => void postal()}>{busy === "postal" ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}</Button></div>
            <label className="checkout-field">Estado<div className="location-select"><select className="field" aria-label="Estado" value={state} onChange={e => { stopLookup(); setState(e.target.value); setCity(""); }}><option value="">Selecione seu estado</option>{UFS.map(uf => <option key={uf}>{uf}</option>)}</select><ChevronDown /></div></label>
            <Button variant="storefront" size="storefront" className="btn-primary location-primary" disabled={!state} onClick={() => { stopLookup(); setStep("city"); }}>Continuar <ArrowRight /></Button>
          </div>}
          {step === "city" && <div className="location-form"><div className="location-region"><MapPin /><span>Seu estado<strong>{state}</strong></span><Button variant="storefront" size="storefront" className="location-edit" onClick={() => { stopLookup(); setStep("state"); }}>Alterar</Button></div><label className="checkout-field">Cidade<input className="field" aria-label="Cidade" list="location-cities" autoComplete="address-level2" placeholder="Nome da sua cidade" value={city} onChange={e => { stopLookup(); setCity(e.target.value); }} /><datalist id="location-cities">{cities.map(c => <option key={c} value={c} />)}</datalist></label><Button variant="storefront" size="storefront" className="btn-primary location-primary" disabled={!city.trim()} onClick={confirmCity}>Confirmar localização <ArrowRight /></Button></div>}
          {step === "result" && <div className="location-form"><div className="location-destination"><MapPin /><div><span>Você está em</span><strong>{city}, {state}</strong></div><Button variant="storefront" size="storefront" className="location-edit" aria-label="Alterar cidade" onClick={() => setStep("city")}>Alterar</Button></div><div className="location-store"><strong className="location-store-name"><img src={verifiedBadge.url} alt="" aria-hidden className="verified-mark" />{menu.store.name}</strong><span>Entrega grátis</span></div><p className="location-coverage">1,6 km · distância de exemplo</p><Button variant="storefront" size="storefront" className="btn-primary location-primary" onClick={() => { if (city.trim() && state) rememberPlace({ city: city.trim(), state }); changeOpen(false); }}>Ver cardápio <ArrowRight /></Button></div>}
          {feedback && <p role="status" className="location-feedback">{feedback}</p>}
        </div>
      </div>
    </Dialog.Content>
  </Dialog.Root>;
}