import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, MapPin, LocateFixed, LoaderCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lookupPostal } from "@/lib/postal";
import { UFS, placeFromCoords } from "@/lib/place";
import type { Menu } from "@/lib/menu";

export function LocationWelcome({ menu }: { menu: Menu }) {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState<"state" | "city" | "search" | "result">("state");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [cep, setCep] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const autoTried = useRef(false);

  useEffect(() => {
    if (!state) return;
    const controller = new AbortController();
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((rows: { nome: string }[]) => setCities(rows.map(row => row.nome)))
      .catch(() => setCities([]));
    return () => controller.abort();
  }, [state]);

  useEffect(() => {
    if (step !== "search") return;
    const timer = setTimeout(() => setStep("result"), 1600);
    return () => clearTimeout(timer);
  }, [step]);

  async function detect(auto: boolean) {
    if (!navigator.geolocation) {
      setFeedback("Localização indisponível neste aparelho. Informe seu CEP ou escolha o estado.");
      return;
    }
    setBusy(true);
    setFeedback("");
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 60000 }),
      );
      const place = await placeFromCoords(position.coords.latitude, position.coords.longitude);
      setState(place.state);
      setCity(place.city);
      setStep("city");
      setFeedback(`Identificamos ${place.city}/${place.state} pela sua localização.`);
    } catch (error) {
      const denied = typeof error === "object" && error !== null && "code" in error && (error as { code: number }).code === 1;
      setFeedback(
        denied
          ? "Você negou o acesso à localização. Informe seu CEP ou escolha o estado."
          : error instanceof Error
            ? error.message
            : "Não foi possível identificar sua cidade automaticamente. Informe seu CEP.",
      );
      if (auto) setFeedback(previous => `${previous} Você ainda pode buscar pelo CEP.`);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    void detect(true);
  }, []);

  const postal = async () => {
    setBusy(true);
    setFeedback("");
    try {
      const address = await lookupPostal(cep);
      setState(address.state);
      setCity(address.city);
      setStep("city");
      setFeedback("Estado e cidade encontrados pelo CEP.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível consultar o CEP.");
    } finally {
      setBusy(false);
    }
  };

  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal>
    <Dialog.Overlay className="sheet-backdrop" />
    <Dialog.Content className="location-modal" aria-describedby="location-description">
      <Button variant="storefront" size="storefront" className="icon-btn absolute right-3 top-3" aria-label="Fechar localização" onClick={() => setOpen(false)}><X /></Button>
      <div className="location-visual"><img src={menu.cover} alt={menu.coverAlt} /><span><MapPin /></span></div>
      <div className="p-6">
        <p className="mb-3 text-xs font-semibold text-muted-foreground">Pré-lançamento · Demonstração</p>
        <Dialog.Title className="font-display text-xl font-semibold">
          {step === "state" ? "Procure o delivery mais próximo de você" : step === "city" ? "Estamos quase lá" : step === "search" ? "Buscando delivery mais próximo" : menu.store.name}
        </Dialog.Title>
        <p id="location-description" className="mt-2 text-sm text-muted-foreground">{step === "state" ? "Escolha seu estado ou informe seu CEP." : step === "city" ? "Agora selecione sua cidade." : step === "search" ? `Buscando em ${city}…` : `Você em ${city}, ${state}`}</p>
        {step === "state" && <div className="mt-5 grid gap-3">
          <Button variant="storefront" size="storefront" className="location-detect" disabled={busy} onClick={() => void detect(false)}>{busy ? <LoaderCircle className="animate-spin" /> : <LocateFixed />}Usar minha localização</Button>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"><input aria-label="CEP para localização" className="field" placeholder="Seu CEP" inputMode="numeric" value={cep} onChange={e => setCep(e.target.value)} /><Button variant="storefront" size="storefront" className="location-detect px-3" disabled={busy || cep.replace(/\D/g, "").length !== 8} onClick={() => void postal()}>Buscar</Button></div>
          <label className="checkout-field">Estado<select className="field" aria-label="Estado" value={state} onChange={e => { setState(e.target.value); setCity(""); }}><option value="">Selecione</option>{UFS.map(uf => <option key={uf}>{uf}</option>)}</select></label>
          <Button variant="storefront" size="storefront" className="btn-primary" disabled={!state || busy} onClick={() => setStep("city")}>Continuar <ArrowRight /></Button>
        </div>}
        {step === "city" && <div className="mt-5 grid gap-3"><label className="checkout-field">Cidade<input className="field" aria-label="Cidade" list="location-cities" value={city} onChange={e => setCity(e.target.value)} /><datalist id="location-cities">{cities.map(c => <option key={c} value={c} />)}</datalist></label><Button variant="storefront" size="storefront" className="btn-primary" disabled={!city.trim()} onClick={() => setStep("search")}>OK <ArrowRight /></Button></div>}
        {step === "search" && <div role="status" className="py-8"><LoaderCircle className="mx-auto h-9 w-9 animate-spin text-primary" /></div>}
        {step === "result" && <div className="mt-5"><div className="flex items-center gap-2 text-lg font-semibold"><Check className="text-success" />1,6 km · distância de exemplo</div><p className="mt-3 text-sm text-muted-foreground">Endereço e cobertura da loja ainda em definição. A distância real não foi calculada.</p><Button variant="storefront" size="storefront" className="btn-primary mt-5 w-full" onClick={() => setOpen(false)}>Ver cardápio <ArrowRight /></Button></div>}
        {feedback && <p role="status" className="mt-3 text-xs text-muted-foreground">{feedback}</p>}
      </div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
