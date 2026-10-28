import { describe, expect, it } from "vitest";
import { LANCHES } from "@/lib/lanches";
import { SUSHI } from "@/lib/sushi";
import { WHATSAPP } from "@/lib/menu";

describe("Cardápio de lanches", () => {
  it("cobra pedido mínimo de R$ 30 e entrega grátis", () => {
    expect(LANCHES.store.minOrder).toBe(30);
    expect(LANCHES.store.deliveryFee).toBe(0);
  });

  it("abre em / com o nome da hamburgueria", () => {
    expect(LANCHES.to).toBe("/");
    expect(LANCHES.store.name).toBe("Casa Brasa Lanches");
  });

  it("tem burgers, combos, porções, bebidas e sobremesas", () => {
    expect(LANCHES.categories).toEqual([
      "Burgers",
      "Combos",
      "Porções",
      "Bebidas",
      "Sobremesas",
    ]);
  });
});

describe("Página de sushi", () => {
  it("fica em /sushi e cobra pedido mínimo de R$ 45 com entrega grátis", () => {
    expect(SUSHI.to).toBe("/sushi");
    expect(SUSHI.store.name).toBe("Casa Brasa Sushi");
    expect(SUSHI.store.minOrder).toBe(45);
    expect(SUSHI.store.deliveryFee).toBe(0);
  });

  it("tem combos, enrolados, hot rolls, temaki, sashimi e bebidas", () => {
    expect(SUSHI.categories).toEqual([
      "Combos",
      "Enrolados",
      "Hot Rolls",
      "Temaki",
      "Sashimi & Niguiri",
      "Bebidas",
    ]);
  });
});

describe("Regras dos dois cardápios", () => {
  for (const menu of [LANCHES, SUSHI]) {
    it(`${menu.label}: todo item pertence a uma categoria exibida e tem preço acima de zero`, () => {
      const ids = menu.products.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const p of menu.products) {
        expect(menu.categories).toContain(p.category);
        expect(p.price).toBeGreaterThan(0);
      }
    });
  }

  it("os dois cardápios enviam para o mesmo WhatsApp", () => {
    expect(LANCHES.store.whatsapp).toBe(WHATSAPP);
    expect(SUSHI.store.whatsapp).toBe(WHATSAPP);
  });

  it("os dois cardápios mostram nota 4,9 com 1.367 avaliações", () => {
    for (const menu of [LANCHES, SUSHI]) {
      expect(menu.store.rating).toBe(4.9);
      expect(menu.store.reviews).toBe(1367);
    }
  });
});
