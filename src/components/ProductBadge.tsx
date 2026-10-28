import { Flame, Users, Leaf, Heart } from "lucide-react";

export function ProductBadge({ label }: { label: string }) {
  const serving = /serve|peças|pessoas/i.test(label);
  const popular = /pedido|favorito/i.test(label);
  const veggie = /veg/i.test(label);
  const Icon = serving ? Users : popular ? Flame : veggie ? Leaf : Heart;
  return <span className={`product-badge ${serving ? "badge-serving" : popular ? "badge-popular" : "badge-special"}`}>
    <Icon aria-hidden="true" />
    {label}
  </span>;
}