import type { PixPayment } from "@/lib/pix";

export type PixAttempt = { access: string; payment?: PixPayment };
export function newPixAccess() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, "0")).join("");
}
export function rememberPixAttempt(previous: PixAttempt[], access: string, payment?: PixPayment): PixAttempt[] {
  const existing = previous.find(attempt => attempt.access === access);
  // Persist payment display only; payment status must be verified again after reload.
  const display = payment ? { orderId: payment.orderId, amount: payment.amount, code: payment.code, status: "PENDING" } : existing?.payment;
  return [...previous.filter(attempt => attempt.access !== access), { access, ...(display ? { payment: display } : {}) }];
}
export function readPixAttempts(menuPath: string): PixAttempt[] {
  try {
    const history: unknown = JSON.parse(sessionStorage.getItem(`pix-history:${menuPath}`) || "[]");
    const active: unknown = JSON.parse(sessionStorage.getItem(`pix:${menuPath}`) || "null");
    const entries = [...(Array.isArray(history) ? history : []), active];
    return entries.reduce<PixAttempt[]>((attempts, entry) => {
      if (!entry || typeof entry.access !== "string" || !/^[a-f0-9]{64}$/.test(entry.access)) return attempts;
      const payment = entry.payment;
      const display = payment && typeof payment.orderId === "string" && typeof payment.code === "string" && typeof payment.amount === "number" ? payment : undefined;
      return rememberPixAttempt(attempts, entry.access, display);
    }, []);
  } catch { return []; }
}