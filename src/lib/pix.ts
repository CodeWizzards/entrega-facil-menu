import { z } from "zod";
import { deliveryErrors, type DeliveryDetails } from "@/lib/checkout";
import type { Menu } from "@/lib/menu";

const field = z.string().trim().max(200);
export const pixAccessSchema = z.object({ access: z.string().regex(/^[a-f0-9]{64}$/) });
export const pixCheckoutSchema = pixAccessSchema.extend({
  menuPath: z.enum(["/", "/sushi"]),
  form: z.object({ name: field, email: field, cpf: field, phone: field, cep: field, street: field, number: field, neighborhood: field, city: field, state: field, complement: field, reference: field }),
  items: z.array(z.object({ productId: z.string().max(80), qty: z.number().int().min(1).max(99), addonIds: z.array(z.string().max(80)).max(30), note: z.string().max(500) })).min(1).max(100),
});
export type PixCheckout = z.infer<typeof pixCheckoutSchema>;
export type PixPayment = { orderId: string; amount: number; code: string; status: string; whatsappMessage?: string; method?: "PIX" | "CARD" };
export function priceCheckout(menu: Menu, input: PixCheckout) {
  if (Object.keys(deliveryErrors(input.form as DeliveryDetails)).length) throw new Error("Confira os dados e o endereço do pedido.");
  const items = input.items.map(item => {
    const product = menu.products.find(p => p.id === item.productId);
    if (!product) throw new Error("Produto indisponível.");
    if (new Set(item.addonIds).size !== item.addonIds.length) throw new Error("Adicional repetido.");
    const addons = item.addonIds.map(id => {
      const addon = product.addons?.find(a => a.id === id);
      if (!addon) throw new Error("Adicional indisponível.");
      return addon;
    });
    const cents = Math.round(product.price * 100) + addons.reduce((sum, addon) => sum + Math.round(addon.price * 100), 0);
    return { name: product.name, qty: item.qty, addons, note: item.note, cents: cents * item.qty };
  });
  const subtotal = items.reduce((sum, item) => sum + item.cents, 0);
  if (subtotal < Math.round(menu.store.minOrder * 100)) throw new Error("Pedido abaixo do valor mínimo.");
  return { items, amountCents: subtotal + Math.round(menu.store.deliveryFee * 100) };
}
export const pixCreatedSchema = z.object({ success: z.literal(true), transactionId: z.string().regex(/^fire_tx_[a-zA-Z0-9_-]+$/), amount: z.number().positive(), pixCopiaECola: z.string().min(20).max(4096), status: z.string() });
export function verifiedPixStatus(value: unknown, transactionId: string, amount: number) {
  const result = z.object({ transactionId: z.string(), amount: z.number(), status: z.enum(["PAID", "PENDING", "CANCELLED", "REFUNDED"]) }).safeParse(value);
  if (!result.success || result.data.transactionId !== transactionId || Math.round(result.data.amount * 100) !== Math.round(amount * 100)) throw new Error("Não foi possível confirmar o pagamento. Tente consultar novamente.");
  return result.data.status;
}