import { describe, expect, it } from "vitest";
import { credentialsMatch } from "@/lib/private-access.server";

const expected = { username: "fixture-account", password: "fixture-password-only" };
describe("Acesso reservado com um único usuário", () => {
  it("aceita somente o par configurado", () => {
    expect(credentialsMatch(expected, expected)).toBe(true);
    expect(credentialsMatch({ ...expected, username: "other-account" }, expected)).toBe(false);
    expect(credentialsMatch({ ...expected, password: "other-password" }, expected)).toBe(false);
  });
  it("não aceita campos vazios nem prefixos da senha", () => {
    expect(credentialsMatch({ username: "", password: "" }, expected)).toBe(false);
    expect(credentialsMatch({ ...expected, password: "fixture-password" }, expected)).toBe(false);
  });
});