import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { Secret, TOTP } from "otpauth";

export const CHALLENGE_MS = 5 * 60 * 1000;
export type PrivateSessionData = { unlocked?: boolean; mfaVersion?: number; challengeUntil?: number; pendingSecret?: string; accountKey?: string };

export function privateAccessGranted(data: PrivateSessionData) {
  return data.unlocked === true && data.mfaVersion === 1;
}
export function challengeActive(data: PrivateSessionData, now = Date.now()) {
  return !data.unlocked && typeof data.challengeUntil === "number" && data.challengeUntil > now && !!data.accountKey;
}
export function initialSetupAccess(data: PrivateSessionData, enrolled: boolean, now = Date.now()) {
  return !enrolled && challengeActive(data, now) && typeof data.pendingSecret === "string" && data.pendingSecret.length > 0;
}
export function authenticator(secret: string) {
  return new TOTP({ issuer: "Casa Brasa", label: "Acesso reservado", algorithm: "SHA1", digits: 6, period: 30, secret: Secret.fromBase32(secret) });
}
export function newAuthenticatorSecret() { return new Secret({ size: 20 }).base32; }
export function validCounter(secret: string, code: string, lastCounter: number, now = Date.now()) {
  if (!/^\d{6}$/.test(code)) return null;
  const delta = authenticator(secret).validate({ token: code, timestamp: now, window: 1 });
  if (delta === null) return null;
  const counter = Math.floor(now / 30000) + delta;
  return counter > lastCounter ? counter : null;
}
export function encryptAuthenticator(secret: string, key: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", createHash("sha256").update(key).digest(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
}
export function decryptAuthenticator(value: string, key: string) {
  const bytes = Buffer.from(value, "base64");
  const decipher = createDecipheriv("aes-256-gcm", createHash("sha256").update(key).digest(), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8");
}
export function privateAccountKey(username: string) { return createHash("sha256").update(username).digest("hex"); }