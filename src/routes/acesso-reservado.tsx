import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { KeyRound, LoaderCircle, LockKeyhole, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginPrivatePage, logoutPrivatePage, readPrivatePage } from "@/lib/private-access.functions";

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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <main className="min-h-dvh bg-background px-6 py-16 text-foreground">
    <div className="mx-auto max-w-sm">
      <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary"><LockKeyhole className="h-6 w-6" /></span>
      <p className="mb-2 text-sm font-semibold text-muted-foreground">Casa Brasa</p>
      <h1 className="font-display text-2xl font-semibold">Acesso reservado</h1>
      {data.authenticated ? <div className="mt-8">
        <p role="status" className="text-success">{data.content}</p>
        <Button variant="outline" className="mt-6 w-full rounded-full" disabled={busy} onClick={async () => {
          setBusy(true); setError("");
          try { await logout(); await router.invalidate(); }
          catch { setError("Não foi possível sair. Tente novamente."); }
          finally { setBusy(false); }
        }}><LogOut /> Sair</Button>
      </div> : <form className="mt-8 grid gap-4" onSubmit={async event => {
        event.preventDefault(); if (busy) return;
        setBusy(true); setError("");
        try {
          const result = await login({ data: { username, password } });
          setPassword("");
          if (!result.ok) { setError("Usuário ou senha incorretos."); return; }
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