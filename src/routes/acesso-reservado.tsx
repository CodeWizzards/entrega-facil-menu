import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { KeyRound, LoaderCircle, LockKeyhole, LogOut, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrivateFinance } from "@/components/PrivateFinance";
import { PrivateCardTests } from "@/components/PrivateCardTests";
import { loginPrivatePage, logoutPrivatePage, readPrivatePage, preparePrivateAuthenticator, verifyPrivateAuthenticator } from "@/lib/private-access.functions";

export const Route = createFileRoute("/acesso-reservado")({
  loader: () => readPrivatePage(),
  head: () => ({ meta: [
    { title: "Casa Brasa — Acesso reservado" },
    { name: "description", content: "Área reservada da Casa Brasa." },
    { property: "og:title", content: "Casa Brasa — Acesso reservado" },
    { property: "og:description", content: "Área reservada da Casa Brasa." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow, noarchive" },
  ] }),
  component: PrivatePage,
});

function PrivatePage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const login = useServerFn(loginPrivatePage);
  const logout = useServerFn(logoutPrivatePage);
  const prepare = useServerFn(preparePrivateAuthenticator);
  const verify = useServerFn(verifyPrivateAuthenticator);
  const read = useServerFn(readPrivatePage);
  const [code, setCode] = useState("");
  const [setup, setSetup] = useState<{ qr: string; key: string } | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setSetup(null);
    if (data.step === "setup" && showSetup) {
      void (async () => {
        try {
          const details = await prepare();
          const QRCode = await import("qrcode");
          const qr = await QRCode.toDataURL(details.uri, { width: 240, margin: 2, errorCorrectionLevel: "M" });
          if (!cancelled) setSetup({ qr, key: details.key });
        } catch { if (!cancelled) setError("Não foi possível carregar o QR code. Entre novamente."); }
      })();
    }
    return () => { cancelled = true; };
  }, [data.step, showSetup, prepare]);
  return <main className="min-h-dvh bg-background px-6 py-16 text-foreground">
    <div className={`mx-auto ${data.authenticated ? "max-w-5xl" : "max-w-sm"}`}>
      <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary"><LockKeyhole className="h-6 w-6" /></span>
      <p className="mb-2 text-sm font-semibold text-muted-foreground">Casa Brasa</p>
      <h1 className="font-display text-2xl font-semibold">{data.authenticated ? "Painel financeiro" : "Acesso reservado"}</h1>
      {data.authenticated && <div className="mt-8">
        {data.step === "setup" && <section className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6"><div><h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-primary" />Autenticação de dois fatores</h2><p className="mt-2 text-sm text-muted-foreground">Ainda não ativada. Cadastre o aplicativo uma única vez.</p></div><Button disabled={busy || showSetup} onClick={() => setShowSetup(true)}><Smartphone />Ativar dois fatores</Button></section>}
        {data.finance && <PrivateFinance finance={data.finance} busy={busy} refresh={() => { setBusy(true); setError(""); void router.invalidate().catch(() => setError("Não foi possível atualizar os pagamentos.")).finally(() => setBusy(false)); }} />}
        {data.step === "authenticated" && <PrivateCardTests />}
        <Button variant="outline" className="mt-8 rounded-full" disabled={busy} onClick={async () => {
          setBusy(true); setError("");
          try { await logout(); await router.invalidate(); }
          catch { setError("Não foi possível sair. Tente novamente."); }
          finally { setBusy(false); }
        }}><LogOut /> Sair</Button>
      </div>}
      {(data.step === "setup" && showSetup) || data.step === "verify" ? <form className="mt-8 grid max-w-sm gap-5" onSubmit={async event => {
        event.preventDefault(); if (busy) return;
        setBusy(true); setError("");
        try {
          const result = await verify({ data: { code } });
          setCode("");
          if (!result.ok) { setError("Código inválido, expirado ou já utilizado. Aguarde o próximo código ou entre novamente."); return; }
          setSetup(null); setShowSetup(false); await router.invalidate();
        } catch { setError("Não foi possível confirmar. Tente novamente."); }
        finally { setBusy(false); }
      }}>
        <div className="flex items-center gap-3"><Smartphone className="h-5 w-5 text-primary" /><h2 className="font-semibold">{data.step === "setup" ? "Configurar Google Authenticator" : "Verificação em duas etapas"}</h2></div>
        {data.step === "setup" && <>
          <p className="text-sm text-muted-foreground">No Google Authenticator, toque em + e escaneie este QR code. Depois, confirme com o código do aplicativo.</p>
          {setup ? <>
            <img src={setup.qr} width={240} height={240} alt="QR code de configuração do Google Authenticator" className="mx-auto rounded-lg" />
            <details className="text-sm text-muted-foreground"><summary className="cursor-pointer">Inserir chave manualmente</summary><p className="mt-3 break-all rounded-lg bg-secondary p-3 font-mono text-foreground">{setup.key}</p></details>
          </> : <div className="flex h-60 items-center justify-center"><LoaderCircle className="animate-spin text-muted-foreground" aria-label="Carregando QR code" /></div>}
        </>}
        <label className="checkout-field"><span>Código do autenticador</span><input className="field text-center font-mono text-2xl" aria-label="Código do autenticador" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required minLength={6} maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></label>
        <Button type="submit" className="h-12 w-full rounded-full" disabled={busy || code.length !== 6 || (data.step === "setup" && !setup)}>{busy ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />} {busy ? "Confirmando…" : data.step === "setup" ? "Confirmar ativação" : "Confirmar e entrar"}</Button>
        <Button variant="ghost" type="button" disabled={busy} onClick={async () => { setSetup(null); setCode(""); setError(""); if (data.step === "setup") { setShowSetup(false); return; } await logout(); await router.invalidate(); }}>{data.step === "setup" ? "Cancelar ativação" : "Voltar para o login"}</Button>
      </form> : !data.authenticated && <form className="mt-8 grid gap-4" onSubmit={async event => {
        event.preventDefault(); if (busy) return;
        setBusy(true); setError("");
        try {
          const result = await login({ data: { username, password } });
          setPassword("");
          if (!result.ok) { setError("Usuário ou senha incorretos."); return; }
          const next = await read();
          if (next.step === "login") {
            setError("Seu navegador não manteve o acesso. Abra esta página em uma nova aba e tente novamente.");
            return;
          }
          setUsername(""); await router.invalidate();
        } catch { setError("Não foi possível entrar. Confira seus dados e tente novamente."); }
        finally { setBusy(false); }
      }}>
        <label className="checkout-field"><span>Usuário</span><input className="field" aria-label="Usuário" autoComplete="username" required maxLength={256} value={username} onChange={event => setUsername(event.target.value)} /></label>
        <label className="checkout-field"><span>Senha</span><input className="field" aria-label="Senha" autoComplete="current-password" type="password" required maxLength={1024} value={password} onChange={event => setPassword(event.target.value)} /></label>
        <Button className="mt-2 h-12 w-full rounded-full" disabled={busy} type="submit">{busy ? <LoaderCircle className="animate-spin" /> : <KeyRound />} {busy ? "Entrando…" : "Entrar"}</Button>
      </form>}
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    </div>
  </main>;
}