import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader, useSession } from "@tanstack/react-start/server";
import { z } from "zod";

const credentialsSchema = z.object({ username: z.string().min(1).max(256), password: z.string().min(1).max(1024) });

async function privateSession(password: string) {
  const { privateSessionCookie } = await import("@/lib/private-access.server");
  return useSession<import("./private-totp.server").PrivateSessionData>({
    password,
    name: "casa-brasa-private",
    maxAge: 60 * 60,
    sessionHeader: false,
    cookie: privateSessionCookie(getRequest().url),
  });
}

export const readPrivatePage = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeader("Cache-Control", "no-store");
  const secret = process.env["PRIVATE_SESSION_SECRET"];
  if (!secret) return { authenticated: false, content: "", step: "login" as const, finance: null };
  const session = await privateSession(secret);
  const { privateAccessGranted, challengeActive, initialSetupAccess } = await import("@/lib/private-totp.server");
  let setupAccess = false;
  if (challengeActive(session.data) && session.data.pendingSecret) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: enrollment, error } = await supabaseAdmin.from("private_authenticator").select("account_key").eq("account_key", session.data.accountKey ?? "").maybeSingle();
    if (error) throw new Error("Não foi possível verificar o autenticador.");
    setupAccess = initialSetupAccess(session.data, !!enrollment);
  }
  if (!privateAccessGranted(session.data) && !setupAccess) return { authenticated: false, content: "", finance: null, step: challengeActive(session.data) ? "verify" as const : "login" as const };
  const { loadPrivateFinance } = await import("@/lib/private-finance.server");
  return { authenticated: true, content: "Acesso autorizado", step: setupAccess ? "setup" as const : "authenticated" as const, finance: await loadPrivateFinance(session.data, !setupAccess) };
});

// Só libera o teste de cartão na sacola para quem já tem sessão privada válida.
export const readCardTestAccess = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeader("Cache-Control", "no-store");
  const secret = process.env["PRIVATE_SESSION_SECRET"];
  if (!secret) return { allowed: false };
  const session = await privateSession(secret);
  const { privateAccessGranted } = await import("@/lib/private-totp.server");
  return { allowed: privateAccessGranted(session.data) };
});

export const loginPrivatePage = createServerFn({ method: "POST" })
  .inputValidator(input => credentialsSchema.parse(input))
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");
    const username = process.env["PRIVATE_USERNAME"];
    const password = process.env["PRIVATE_PASSWORD"];
    const secret = process.env["PRIVATE_SESSION_SECRET"];
    if (!username || !password || !secret) throw new Error("Acesso privado ainda não configurado.");
    const { credentialsMatch } = await import("@/lib/private-access.server");
    const session = await privateSession(secret);
    await session.clear();
    if (!credentialsMatch(data, { username, password })) return { ok: false };
    const { privateAccountKey, newAuthenticatorSecret, CHALLENGE_MS } = await import("@/lib/private-totp.server");
    const accountKey = privateAccountKey(username);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: enrollment, error } = await supabaseAdmin.from("private_authenticator").select("account_key").eq("account_key", accountKey).maybeSingle();
    if (error) throw new Error("Não foi possível verificar o autenticador.");
    await session.update({ unlocked: false, accountKey, challengeUntil: Date.now() + CHALLENGE_MS, ...(!enrollment ? { pendingSecret: newAuthenticatorSecret() } : {}) });
    return { ok: true };
  });

export const preparePrivateAuthenticator = createServerFn({ method: "POST" }).handler(async () => {
  setResponseHeader("Cache-Control", "no-store");
  const secret = process.env["PRIVATE_SESSION_SECRET"];
  if (!secret) throw new Error("Acesso não configurado.");
  const session = await privateSession(secret);
  const { challengeActive, authenticator } = await import("@/lib/private-totp.server");
  if (!challengeActive(session.data) || !session.data.pendingSecret) throw new Error("Entre novamente para configurar.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: enrollment, error } = await supabaseAdmin.from("private_authenticator").select("account_key").eq("account_key", session.data.accountKey ?? "").maybeSingle();
  if (error || enrollment) throw new Error("O autenticador já está ativo ou não pôde ser consultado.");
  return { uri: authenticator(session.data.pendingSecret).toString(), key: session.data.pendingSecret };
});

export const verifyPrivateAuthenticator = createServerFn({ method: "POST" })
  .inputValidator(input => z.object({ code: z.string().regex(/^\d{6}$/) }).parse(input))
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");
    const secret = process.env["PRIVATE_SESSION_SECRET"];
    if (!secret) throw new Error("Acesso não configurado.");
    const session = await privateSession(secret);
    const { challengeActive, validCounter, encryptAuthenticator, decryptAuthenticator } = await import("@/lib/private-totp.server");
    const accountKey = session.data.accountKey;
    if (!challengeActive(session.data) || !accountKey) return { ok: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: enrollment, error } = await supabaseAdmin.from("private_authenticator").select("secret_encrypted, last_counter").eq("account_key", accountKey).maybeSingle();
    if (error) throw new Error("Não foi possível verificar o código.");
    const totpSecret = enrollment ? decryptAuthenticator(enrollment.secret_encrypted, secret) : session.data.pendingSecret;
    if (!totpSecret) return { ok: false };
    const counter = validCounter(totpSecret, data.code, enrollment?.last_counter ?? -1);
    if (counter === null) return { ok: false };
    if (enrollment) {
      const { data: updated, error: updateError } = await supabaseAdmin.from("private_authenticator").update({ last_counter: counter }).eq("account_key", accountKey).eq("last_counter", enrollment.last_counter).select("account_key");
      if (updateError || !updated?.length) return { ok: false };
    } else {
      const { error: insertError } = await supabaseAdmin.from("private_authenticator").insert({ account_key: accountKey, secret_encrypted: encryptAuthenticator(totpSecret, secret), last_counter: counter });
      if (insertError) return { ok: false };
    }
    await session.clear();
    await session.update({ unlocked: true, mfaVersion: 1 });
    return { ok: true };
  });

export const logoutPrivatePage = createServerFn({ method: "POST" }).handler(async () => {
  setResponseHeader("Cache-Control", "no-store");
  const secret = process.env["PRIVATE_SESSION_SECRET"];
  if (secret) await (await privateSession(secret)).clear();
  return { ok: true };
});