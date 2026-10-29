import { createHash, timingSafeEqual } from "node:crypto";

export function privateSessionCookie(requestUrl: string) {
  const local = new URL(requestUrl).hostname === "localhost";
  return {
    httpOnly: true,
    sameSite: local ? "strict" as const : "none" as const,
    secure: !local,
    partitioned: !local,
    path: "/",
  };
}

export function credentialsMatch(input: { username: string; password: string }, expected: { username: string; password: string }) {
  const hash = (value: string) => createHash("sha256").update(value, "utf8").digest();
  const usernameMatches = timingSafeEqual(hash(input.username), hash(expected.username));
  const passwordMatches = timingSafeEqual(hash(input.password), hash(expected.password));
  return usernameMatches && passwordMatches;
}