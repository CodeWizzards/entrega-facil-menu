import { describe, expect, it } from "vitest";
import { authenticator, challengeActive, decryptAuthenticator, encryptAuthenticator, privateAccessGranted, validCounter } from "@/lib/private-totp.server";

const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"; // RFC 6238 public test vector
describe("Google Authenticator do acesso reservado", () => {
  it("exige segundo fator mesmo em uma sessão antiga com senha válida", () => {
    expect(privateAccessGranted({ unlocked: true })).toBe(false);
    expect(privateAccessGranted({ unlocked: false, mfaVersion: 1 })).toBe(false);
    expect(privateAccessGranted({ unlocked: true, mfaVersion: 1 })).toBe(true);
  });
  it("valida códigos de seis dígitos e rejeita códigos usados", () => {
    expect(validCounter(secret, "287082", -1, 59000)).toBe(1);
    expect(validCounter(secret, "287082", 1, 59000)).toBeNull();
    expect(validCounter(secret, "000000", -1, 59000)).toBeNull();
    expect(validCounter(secret, "94287082", -1, 59000)).toBeNull();
    expect(validCounter(secret, "287082", -1, 150000)).toBeNull();
  });
  it("expira a etapa de senha antes de liberar o painel", () => {
    expect(challengeActive({ accountKey: "fixture", challengeUntil: 300000 }, 299999)).toBe(true);
    expect(challengeActive({ accountKey: "fixture", challengeUntil: 300000 }, 300000)).toBe(false);
    expect(challengeActive({ challengeUntil: 300000 }, 0)).toBe(false);
  });
  it("cifra a chave e rejeita outra chave de criptografia", () => {
    const encrypted = encryptAuthenticator(secret, "fixture-encryption-key-only");
    expect(encrypted).not.toContain(secret);
    expect(decryptAuthenticator(encrypted, "fixture-encryption-key-only")).toBe(secret);
    expect(() => decryptAuthenticator(encrypted, "other-key")).toThrow();
    expect(authenticator(secret).toString()).toContain("issuer=Casa%20Brasa");
  });
});