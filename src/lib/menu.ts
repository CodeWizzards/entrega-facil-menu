// Tipos e helpers compartilhados pelos cardápios.
// Os dados de cada loja ficam em lanches.ts e sushi.ts.

export type Addon = { id: string; name: string; price: number };

export type Product = {
  id: string;
  category: string;
  name: string;
  desc: string;
  price: number;
  image?: string;
  tag?: string;
  addons?: Addon[];
};

export type StoreInfo = {
  name: string;
  tagline: string;
  whatsapp: string;
  deliveryFee: number;
  minOrder: number;
  eta: string;
  /** Nota exibida no cartão da loja, de 0 a 5. */
  rating: number;
  /** Quantidade de avaliações que compõem a nota. */
  reviews: number;
};

export type Menu = {
  /** Rótulo curto usado na troca entre cardápios */
  label: string;
  /** Endereço da página (para o link de troca de cardápio) */
  to: "/" | "/sushi";
  /** Ícone do selo da loja */
  logo: string;
  /** Imagem da logo exibida no círculo sobre a capa */
  logoImg: string;
  store: StoreInfo;
  categories: string[];
  products: Product[];
  /** Foto de cada categoria, usada como miniatura nos cartões de produto */
  categoryImg: Record<string, string>;
  cover: string;
  coverAlt: string;
};

/** Preço em reais, formatado para o Brasil. */
export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Número de WhatsApp único da casa (usado pelos dois cardápios). */
export const WHATSAPP = "5511999999999";
