import { describe, expect, it } from "vitest";
import { isProductPixTest, PRODUCT_PIX_TEST_MODE, productPixTestResult } from "@/lib/product-pix-test";

describe("Pix inicial de produtos em teste", () => {
  it("desativa novas simulações e mantém antigos pedidos identificados como teste", () => {
    expect(PRODUCT_PIX_TEST_MODE).toBe(false);
    expect(productPixTestResult("pedido-teste", 5600)).toMatchObject({ amount: 56, status: "PAID", testMode: true });
    expect(isProductPixTest("test_product_pix_pedido-teste")).toBe(true);
  });
  it("não aprova ficticiamente transações reais", () => {
    expect(isProductPixTest("fire_tx_real")).toBe(false);
  });
  it("não aplica o teste ao Pix da localização ao vivo", () => {
    expect(isProductPixTest("test_product_pix_pedido-teste", "LIVE_LOCATION_FEE")).toBe(false);
    expect(isProductPixTest("test_pix_localizacao")).toBe(false);
  });
  it("não aplica o teste ao cartão", () => {
    expect(isProductPixTest("fire_card_real")).toBe(false);
    expect(isProductPixTest("test_card_demo")).toBe(false);
  });
  it("não gera um código bancário pagável na simulação", () => {
    expect(productPixTestResult("pedido-teste", 5600).code.startsWith("000201")).toBe(false);
  });
});