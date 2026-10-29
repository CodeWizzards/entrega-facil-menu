import { describe, expect, it } from "vitest";
import { credentialsMatch, privateSessionCookie } from "@/lib/private-access.server";
import { privateAccessGranted } from "@/lib/private-totp.server";

const expected = { username: "fixture-account", password: "fixture-password-only" };
describe("Acesso reservado com um único usuário", () => {
  it("mantém a sessão na prévia incorporada sem expor o cookie a scripts", () => {
    expect(privateSessionCookie("https://example.test/acesso-reservado")).toEqual({
      httpOnly: true, secure: true, sameSite: "none", partitioned: true, path: "/",
    });
  });
  it("permite o desenvolvimento local sem enfraquecer os cookies publicados", () => {
    expect(privateSessionCookie("http://localhost:8080/acesso-reservado")).toEqual({
      httpOnly: true, secure: false, sameSite: "strict", partitioned: false, path: "/",
    });
  });
  it("aceita somente o par configurado", () => {
    expect(credentialsMatch(expected, expected)).toBe(true);
    expect(credentialsMatch({ ...expected, username: "other-account" }, expected)).toBe(false);
    expect(credentialsMatch({ ...expected, password: "other-password" }, expected)).toBe(false);
  });
  it("não aceita campos vazios nem prefixos da senha", () => {
    expect(credentialsMatch({ username: "", password: "" }, expected)).toBe(false);
    expect(credentialsMatch({ ...expected, password: "fixture-password" }, expected)).toBe(false);
  });
  it("não libera o teste de cartão na sacola antes da sessão completa do painel", () => {
    expect(privateAccessGranted({ unlocked: false, accountKey: "fixture", challengeUntil: 300000, pendingSecret: "fixture-secret" })).toBe(false);
    expect(privateAccessGranted({ unlocked: true, mfaVersion: 1 })).toBe(true);
  });
});