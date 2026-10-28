export type Product = { id: string; name: string; desc: string; price: number; category: string };

export const STORE = {
  name: "Mandala Gastro Bar",
  whatsapp: "5511999999999",
  deliveryFee: 7,
  minOrder: 30,
  eta: "40–60 min",
};

export const CATEGORIES = ["Petiscos", "Burgers", "Pratos", "Bebidas", "Sobremesas"];

export const PRODUCTS: Product[] = [
  { id: "p1", category: "Petiscos", name: "Batata rústica", desc: "Com alecrim, páprica e maionese da casa.", price: 32 },
  { id: "p2", category: "Petiscos", name: "Bolinho de costela", desc: "6 unidades com molho barbecue.", price: 39 },
  { id: "p3", category: "Petiscos", name: "Dadinho de tapioca", desc: "8 unidades com geleia de pimenta.", price: 34 },
  { id: "b1", category: "Burgers", name: "Mandala Burger", desc: "Blend 180g, cheddar, bacon, cebola caramelizada.", price: 42 },
  { id: "b2", category: "Burgers", name: "Smash Duplo", desc: "Dois smash 90g, american cheese, picles.", price: 38 },
  { id: "b3", category: "Burgers", name: "Veggie", desc: "Hambúrguer de grão-de-bico, rúcula e tomate.", price: 36 },
  { id: "m1", category: "Pratos", name: "Picanha na chapa", desc: "500g com farofa, vinagrete e mandioca. Serve 2.", price: 119 },
  { id: "m2", category: "Pratos", name: "Risoto de cogumelos", desc: "Arbóreo, shiitake, parmesão.", price: 58 },
  { id: "d1", category: "Bebidas", name: "Chopp Pilsen 500ml", desc: "Gelado na medida.", price: 16 },
  { id: "d2", category: "Bebidas", name: "Caipirinha", desc: "Limão, cachaça artesanal.", price: 24 },
  { id: "d3", category: "Bebidas", name: "Refrigerante lata", desc: "Coca, Guaraná ou Sprite.", price: 7 },
  { id: "s1", category: "Sobremesas", name: "Petit gâteau", desc: "Com sorvete de creme.", price: 28 },
];

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
