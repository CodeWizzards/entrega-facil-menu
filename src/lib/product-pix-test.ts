/** Isolated checkout simulation; never applies to card or live-location charges. */
export const PRODUCT_PIX_TEST_MODE = false;

export function isProductPixTest(transactionId: string, kind?: string) {
  return kind !== "LIVE_LOCATION_FEE" && transactionId.startsWith("test_product_pix_");
}

export function productPixTestResult(orderId: string, amountCents: number) {
  return {
    orderId,
    amount: amountCents / 100,
    code: `TESTE — NÃO PAGAR — pedido ${orderId} — ${(amountCents / 100).toFixed(2)}`,
    status: "PAID" as const,
    testMode: true,
  };
}