import logoAsset from "@/assets/logo-lanches.png.asset.json";
import cover from "@/assets/cover-lanches.jpg";
import imgBebidas from "@/assets/menu/lanches-bebidas.jpg";
import imgBurgers from "@/assets/menu/lanches-burgers.jpg";
import imgCombos from "@/assets/menu/lanches-combos.jpg";
import imgPorcoes from "@/assets/menu/lanches-porcoes.jpg";
import imgSobremesas from "@/assets/menu/lanches-sobremesas.jpg";
import { WHATSAPP, type Addon, type Menu, type Product } from "@/lib/menu";

// Adicionais que servem para quase todos os sanduíches.
const EXTRAS: Addon[] = [
  { id: "bacon", name: "Bacon extra", price: 8 },
  { id: "cheddar", name: "Cheddar extra", price: 7 },
  { id: "blend", name: "Mais um blend 120g", price: 12 },
  { id: "ovo", name: "Ovo caipira", price: 5 },
  { id: "molho", name: "Molho da casa extra", price: 4 },
  { id: "cebola", name: "Cebola crispy", price: 6 },
];

const MOLHOS: Addon[] = [
  { id: "cheddar", name: "Cheddar cremoso", price: 7 },
  { id: "bacon", name: "Farofa de bacon", price: 6 },
  { id: "barbecue", name: "Barbecue defumado", price: 5 },
];

const REFRIS: Addon[] = [
  { id: "coca", name: "Coca-Cola", price: 0 },
  { id: "guarana", name: "Guaraná", price: 0 },
  { id: "fanta", name: "Fanta laranja", price: 0 },
  { id: "zero", name: "Coca Zero", price: 0 },
];

const products: Product[] = [
  // ---- Burgers ----
  {
    id: "brasa-classico",
    category: "Burgers",
    name: "Brasa Clássico",
    desc: "Blend 160g, queijo prato, alface, tomate e molho da casa no pão brioche.",
    price: 29,
    tag: "O mais pedido",
    addons: EXTRAS,
  },
  {
    id: "duplo-fogo",
    category: "Burgers",
    name: "Duplo Fogo",
    desc: "Dois blends 120g, cheddar duplo, bacon crocante e cebola crispy.",
    price: 39,
    addons: EXTRAS,
  },
  {
    id: "cheddar-bacon",
    category: "Burgers",
    name: "Cheddar Bacon da Casa",
    desc: "Blend 160g, cheddar cremoso derramado, bacon em tiras e maionese defumada.",
    price: 36,
    addons: EXTRAS,
  },
  {
    id: "smash-duplo",
    category: "Burgers",
    name: "Smash Duplo",
    desc: "Dois smash 90g na chapa, american cheese, picles e molho smash.",
    price: 32,
    addons: EXTRAS,
  },
  {
    id: "bbq-brasa",
    category: "Burgers",
    name: "BBQ Brasa",
    desc: "Blend 160g, barbecue defumado, onion rings e cheddar.",
    price: 37,
    addons: EXTRAS,
  },
  {
    id: "frango-crocante",
    category: "Burgers",
    name: "Frango Crocante",
    desc: "Filé de frango empanado, coleslaw e molho chipotle.",
    price: 31,
    addons: EXTRAS,
  },
  {
    id: "veggie-brasa",
    category: "Burgers",
    name: "Veggie Brasa",
    desc: "Hambúrguer de grão-de-bico e beterraba, maionese verde e rúcula.",
    price: 30,
    addons: EXTRAS,
  },
  {
    id: "bacon-supreme",
    category: "Burgers",
    name: "Brasa Bacon Supreme",
    desc: "Blend 200g, cheddar, bacon, ovo caipira e cebola caramelizada. Para quem tem fome de verdade.",
    price: 44,
    tag: "Gigante",
    addons: EXTRAS,
  },
  {
    id: "cheese-bread",
    category: "Burgers",
    name: "Cheese Bread da Brasa",
    desc: "Pão recheado com blend 120g, cheddar e catupira, tostado na chapa.",
    price: 26,
    addons: EXTRAS,
  },
  {
    id: "smash-simples",
    category: "Burgers",
    name: "Smash Simples",
    desc: "Smash 90g, american cheese e molho da casa. O básico bem feito.",
    price: 22,
    addons: EXTRAS,
  },

  // ---- Combos ----
  {
    id: "combo-classico",
    category: "Combos",
    name: "Combo Brasa Clássico",
    desc: "Brasa Clássico + fritas médias + refrigerante lata.",
    price: 42,
    tag: "Melhor custo",
    addons: REFRIS,
  },
  {
    id: "combo-duplo",
    category: "Combos",
    name: "Combo Duplo Fogo",
    desc: "Duplo Fogo + fritas médias + refrigerante lata.",
    price: 52,
    addons: REFRIS,
  },
  {
    id: "combo-casal",
    category: "Combos",
    name: "Combo Casal",
    desc: "2 burgers à escolha + fritas grande com cheddar + 2 refrigerantes.",
    price: 89,
    tag: "Serve 2",
    addons: REFRIS,
  },
  {
    id: "combo-familia",
    category: "Combos",
    name: "Combo Família Brasa",
    desc: "4 burgers + 2 fritas grandes + 4 refrigerantes em lata.",
    price: 159,
    tag: "Serve 4",
    addons: REFRIS,
  },

  // ---- Porções ----
  {
    id: "fritas-rusticas",
    category: "Porções",
    name: "Fritas Rústicas",
    desc: "Batata com casca, alecrim e páprica. 300g.",
    price: 24,
    addons: MOLHOS,
  },
  {
    id: "fritas-cheddar-bacon",
    category: "Porções",
    name: "Fritas Cheddar & Bacon",
    desc: "Fritas cobertas com cheddar cremoso e bacon crocante. 350g.",
    price: 34,
    tag: "Mais pedida",
    addons: MOLHOS,
  },
  {
    id: "onion-rings",
    category: "Porções",
    name: "Onion Rings",
    desc: "10 anéis de cebola empanados e fritos na hora.",
    price: 26,
  },
  {
    id: "dadinho",
    category: "Porções",
    name: "Dadinho de Tapioca",
    desc: "12 cubinhos crocantes com geleia de pimenta.",
    price: 28,
  },
  {
    id: "bolinho-costela",
    category: "Porções",
    name: "Bolinho de Costela",
    desc: "8 unidades com barbecue da casa.",
    price: 32,
  },
  {
    id: "asinha",
    category: "Porções",
    name: "Asinhas BBQ",
    desc: "8 asinhas glaceadas no barbecue com gergelim.",
    price: 30,
  },

  // ---- Bebidas ----
  {
    id: "refri-lata",
    category: "Bebidas",
    name: "Refrigerante lata 350ml",
    desc: "Coca-Cola, Guaraná, Fanta ou Zero.",
    price: 7,
    addons: REFRIS,
  },
  {
    id: "suco-natural",
    category: "Bebidas",
    name: "Suco natural 400ml",
    desc: "Laranja, abacaxi com hortelã ou maracujá.",
    price: 12,
  },
  {
    id: "limonada",
    category: "Bebidas",
    name: "Limonada Suíça 400ml",
    desc: "Batida com leite condensado e raspas de limão.",
    price: 14,
  },
  {
    id: "cha-gelado",
    category: "Bebidas",
    name: "Chá gelado 400ml",
    desc: "Pêsseo com limão, adoçado na medida.",
    price: 9,
  },
  {
    id: "agua",
    category: "Bebidas",
    name: "Água mineral 500ml",
    desc: "Com ou sem gás.",
    price: 5,
  },

  // ---- Sobremesas ----
  {
    id: "petit",
    category: "Sobremesas",
    name: "Petit Gâteau",
    desc: "Bolinho quente de chocolate com sorvete de creme.",
    price: 22,
  },
  {
    id: "milkshake",
    category: "Sobremesas",
    name: "Milk-shake 400ml",
    desc: "Chocolate, morango ou ovomaltine.",
    price: 19,
  },
  {
    id: "brownie",
    category: "Sobremesas",
    name: "Brownie com Sorvete",
    desc: "Brownie de chocolate meio amargo com sorvete de baunilha.",
    price: 20,
  },
  {
    id: "casquinha",
    category: "Sobremesas",
    name: "Casquinha Dupla",
    desc: "Creme com cobertura de chocolate.",
    price: 10,
  },
];

const productImages: Record<string, string> = {
  "brasa-classico": "/menu/lanches/hamburgueres/brasa-classico.webp",
  "duplo-fogo": "/menu/lanches/hamburgueres/duplo-fogo.webp",
  "cheddar-bacon": "/menu/lanches/hamburgueres/cheddar-bacon-da-casa.webp",
  "smash-duplo": "/menu/lanches/hamburgueres/smash-duplo.webp",
  "bbq-brasa": "/menu/lanches/hamburgueres/bbq-brasa.webp",
  "frango-crocante": "/menu/lanches/hamburgueres/frango-crocante.webp",
  "veggie-brasa": "/menu/lanches/hamburgueres/veggie-brasa.webp",
  "bacon-supreme": "/menu/lanches/hamburgueres/brasa-bacon-supreme.webp",
  "cheese-bread": "/menu/lanches/hamburgueres/cheese-brasa-da-brasa.webp",
  "smash-simples": "/menu/lanches/hamburgueres/smash-simples.webp",
  "combo-classico": "/menu/lanches/combos/combo-brasa-classico.webp",
  "combo-duplo": "/menu/lanches/combos/combo-duplo-fogo.webp",
  "combo-casal": "/menu/lanches/combos/combo-casal.webp",
  "combo-familia": "/menu/lanches/combos/combo-familia-brasa.webp",
  "fritas-rusticas": "/menu/lanches/porcoes/fritas-rusticas.webp",
  "fritas-cheddar-bacon": "/menu/lanches/porcoes/fritas-cheddar-bacon.webp",
  "onion-rings": "/menu/lanches/porcoes/onion-rings.webp",
  dadinho: "/menu/lanches/porcoes/dadinho-de-tapioca.webp",
  "bolinho-costela": "/menu/lanches/porcoes/bolinho-de-costela.webp",
  asinha: "/menu/lanches/porcoes/asinhas-bbq.webp",
  "refri-lata": "/menu/lanches/bebidas/refrigerante-lata.webp",
  "suco-natural": "/menu/lanches/bebidas/suco-natural.webp",
  limonada: "/menu/lanches/bebidas/limonada-suica.webp",
  "cha-gelado": "/menu/lanches/bebidas/cha-gelado.webp",
  agua: "/menu/lanches/bebidas/agua-mineral.webp",
  petit: "/menu/lanches/sobremesas/petit-gateau.webp",
  milkshake: "/menu/lanches/sobremesas/milk-shake.webp",
  brownie: "/menu/lanches/sobremesas/brownie-com-sorvete.webp",
  casquinha: "/menu/lanches/sobremesas/casquinha-dupla.webp",
};

export const LANCHES: Menu = {
  label: "Lanches",
  to: "/",
  logo: "B",
  logoImg: logoAsset.url,
  store: {
    name: "Casa Brasa Lanches",
    tagline: "Hamburgueria artesanal · Pão na chapa, blend fresquinho",
    whatsapp: WHATSAPP,
    deliveryFee: 0,
    minOrder: 30,
    eta: "35–55 min",
    rating: 4.9,
    reviews: 1367,
  },
  categories: ["Burgers", "Combos", "Porções", "Bebidas", "Sobremesas"],
  categoryImg: {
    Burgers: imgBurgers,
    Combos: imgCombos,
    Porções: imgPorcoes,
    Bebidas: imgBebidas,
    Sobremesas: imgSobremesas,
  },
  products: products.map((product) => ({
    ...product,
    image: productImages[product.id],
  })),
  cover,
  coverAlt: "Hambúrgueres artesanais com fritas crocantes",
};
