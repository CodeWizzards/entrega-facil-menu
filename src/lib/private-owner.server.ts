import { getRequest, useSession } from "@tanstack/react-start/server";
import { privateSessionCookie } from "@/lib/private-access.server";
import { privateAccessGranted, type PrivateSessionData } from "@/lib/private-totp.server";

// Verdadeiro só quando o navegador que envia tem a sessão completa do painel (o próprio dono testando).
export async function ownerSessionActive() {
  const secret = process.env["PRIVATE_SESSION_SECRET"];
  if (!secret) return false;
  try {
    const session = await useSession<PrivateSessionData>({ password: secret, name: "casa-brasa-private", maxAge: 60 * 60, sessionHeader: false, cookie: privateSessionCookie(getRequest().url) });
    return privateAccessGranted(session.data);
  } catch { return false; }
}
