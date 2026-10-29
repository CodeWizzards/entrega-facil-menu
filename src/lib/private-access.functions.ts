import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader, useSession } from "@tanstack/react-start/server";
import { z } from "zod";

const credentialsSchema = z.object({ username: z.string().min(1).max(256), password: z.string().min(1).max(1024) });

function privateSession(password: string) {
  return useSession<{ unlocked?: boolean }>({
    password,
    name: "casa-brasa-private",
    maxAge: 60 * 60,
    cookie: { httpOnly: true, sameSite: "strict", secure: new URL(getRequest().url).hostname !== "localhost", path: "/" },
  });
}

export const readPrivatePage = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeader("Cache-Control", "no-store");
  const secret = process.env["PRIVATE_SESSION_SECRET"];
  if (!secret) return { authenticated: false, content: "" };
  const session = await privateSession(secret);
  if (session.data.unlocked !== true) return { authenticated: false, content: "" };
  return { authenticated: true, content: "Acesso autorizado" };
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
    if (!credentialsMatch(data, { username, password })) return { ok: false };
    const session = await privateSession(secret);
    await session.clear();
    await session.update({ unlocked: true });
    return { ok: true };
  });

export const logoutPrivatePage = createServerFn({ method: "POST" }).handler(async () => {
  setResponseHeader("Cache-Control", "no-store");
  const secret = process.env["PRIVATE_SESSION_SECRET"];
  if (secret) await (await privateSession(secret)).clear();
  return { ok: true };
});