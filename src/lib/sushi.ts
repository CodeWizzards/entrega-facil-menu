import cover from "@/assets/cover-sushi.jpg";
import logoImg from "@/assets/logo-sushi.png";
import imgBebidas from "@/assets/menu/sushi-bebidas.jpg";
import imgCombos from "@/assets/menu/sushi-combos.jpg";
import imgEnrolados from "@/assets/menu/sushi-enrolados.jpg";
import imgHot from "@/assets/menu/sushi-hot.jpg";
import imgSashimi from "@/assets/menu/sushi-sashimi.jpg";
import imgTemaki from "@/assets/menu/sushi-temaki.jpg";
import { WHATSAPP, type Addon, type Menu, type Product } from "@/lib/menu";

const ACOMPANHAMENTOS: Addon[] = [
  { id: "shoyu", name: "Shoyu extra", price: 3 },
  { id: "gengibre", name: "Gengibre", price: 4 },
  { id: "wasabi", name: "Wasabi extra", price: 4 },
  { id: "hot", name: "Molho hot", price: 5 },
];

const TEMAKI_EXTRAS: Addon[] = [
  { id: "salmao", name: "Mais salmão", price: 9 },
  { id: "cremoso", name: "Creme especial", price: 6 },
  { id: "skin", name: "Skin crocante", price: 7 },
  { id: "hot", name: "Molho hot", price: 5 },
];

const products: Product[] = [
  // ---- Combos ----
  {
    id: "combo-brasa-16",
    category: "Combos",
    name: "Combo Brasa 16 peças",
    desc: "4 filadélfia, 4 salmão cremoso, 4 hot cronchy, 4 hossomaki de pepa.",
    price: 68,
    tag: "Mais pedido",
    addons: ACOMPANHAMENTOS,
  },
  {
    id: "combo-casa-24",
    category: "Combos",
    name: "Combo da Casa 24 peças",
    desc: "Mix de enrolados, 6 hot rolls e 2 temaki de salmão.",
    price: 98,
    tag: "Serve 2",
    addons: ACOMPANHAMENTOS,
  },
  {
    id: "combo-salmao-20",
    category: "Combos",
    name: "Combo Salmão Lovers 20 peças",
    desc: "Só salmão: niguiri, sashimi, filadélfia e hot cronchy.",
    price: 110,
    addons: ACOMPANHAMENTOS,
  },
  {
    id: "combo-delivery-12",
    category: "Combos",
    name: "Combo Delivery 12 peças",
    desc: "Para matar a vontade: filadélfia, california e hot filadélfia.",
    price: 55,
    addons: ACOMPANHAMENTOS,
  },
  {
    id: "combo-festa-40",
    category: "Combos",
    name: "Combo Festa 40 peças",
    desc: "Enrolados variados, hot rolls, sashimi e 4 temaki. Serve 4.",
    price: 159,
    tag: "Serve 4",
    addons: ACOMPANHAMENTOS,
  },

  // ---- Enrolados ----
  {
    id: "filadelfia",
    category: "Enrolados",
    name: "Filadélfia (8 peças)",
    desc: "Salmão fresco com cream cheese, enrolado no arroz e alga.",
    price: 33,
    addons: ACOMPANHAMENTOS,
  },
  {
    id: "salmao-cremoso",
    category: "Enrolados",
    name: "Salmão Cremoso (8 peças)",
    desc: "Salmão com creme especial e cebolinha.",
    price: 35,
    addons: ACOMPANHAMENTOS,
  },
  {
    id: "california",
    category: "Enrolados",
    name: "Califórnia (8 peças)",
    desc: "Kani, pepino e gergelim.",
    price: 28,
    addons: ACOMPANHAMENTOS,
  },
  {
    id: "hossomaki-pepa",
    category: "Enrolados",
    name: "Hossomaki de Pepa (8 peças)",
    desc: "Pepino fresco e shimeji. Leve e crocante.",
    price: 24,
    addons: ACOMPANHAMENTOS,
  },
  {
    id: "uramaki-dragon",
    category: "Enrolados",
    name: "Uramaki Dragon (8 peças)",
    desc: "Camarão empanado com abacate e maionese temperada.",
    price: 39,
    tag: "Novo",
    addons: ACOMPANHAMENTOS,
  },
  {
    id: "sake-hot-crocante",
    category: "Enrolados",
    name: "Sake Hot Crocante (8 peças)",
    desc: "Salmão gratinado com farofa panko e molho tarê.",
    price: 37,
    addons: ACOMPANHAMENTOS,
  },

  // ---- Hot Rolls ----
  {
    id: "hot-cronchy",
    category: "Hot Rolls",
    name: "Hot Cronchy (8 unidades)",
    desc: "Salmão e cream cheese empanados e fritos.",
    price: 32,
    tag: "Mais pedido",
    addons: ACOMPANHAMENTOS,
  },
  {
    id: "hot-filadelfia",
    category: "Hot Rolls",
    name: "Hot Filadélfia (8 unidades)",
    desc: "Filadélfia empanado, crocante por fora e cremoso por dentro.",
    price: 30,
    addons: ACOMPANHAMENTOS,
  },
  {
    id: "hot-spicy",
    category: "Hot Rolls",
    name: "Hot Spicy Tuna (8 unidades)",
    desc: "Atum com molho spicy e cebolinha, empanado na hora.",
    price: 36,
    addons: ACOMPANHAMENTOS,
  },
  {
    id: "hot-veg",
    category: "Hot Rolls",
    name: "Hot Vegetariano (8 unidades)",
    desc: "Legumes salteados com shimeji e cream cheese.",
    price: 27,
    addons: ACOMPANHAMENTOS,
  },

  // ---- Temaki ----
  {
    id: "temaki-salmao",
    category: "Temaki",
    name: "Temaki Salmão Completo",
    desc: "Cone de alga com arroz, salmão, pepino e cream cheese.",
    price: 29,
    addons: TEMAKI_EXTRAS,
  },
  {
    id: "temaki-skin",
    category: "Temaki",
    name: "Temaki Skin Crocante",
    desc: "Pele de salmão crocante com cebolinha e shimeji.",
    price: 26,
    addons: TEMAKI_EXTRAS,
  },
  {
    id: "temaki-spicy",
    category: "Temaki",
    name: "Temaki Spicy Tuna",
    desc: "Atum com molho picante da casa e cebolinha.",
    price: 31,
    addons: TEMAKI_EXTRAS,
  },
  {
    id: "temaki-vegano",
    category: "Temaki",
    name: "Temaki Vegano",
    desc: "Abacate, manga, pepino e gergelim.",
    price: 25,
    addons: TEMAKI_EXTRAS,
  },

  // ---- Sashimi & Niguiri ----
  {
    id: "sashimi-salmao",
    category: "Sashimi & Niguiri",
    name: "Sashimi de Salmão (6 fatias)",
    desc: "Corte fino, peixe do dia.",
    price: 32,
    addons: ACOMPANHAMENTOS,
  },
  {
    id: "sashimi-misto",
    category: "Sashimi & Niguiri",
    name: "Sashimi Misto (9 fatias)",
    desc: "Salmão, atum e white fish.",
    price: 45,
    addons: ACOMPANHAMENTOS,
  },
  {
    id: "niguiri-salmao",
    category: "Sashimi & Niguiri",
    name: "Niguiri de Salmão (2 unidades)",
    desc: "Salmão maçaricado sobre arroz temperado.",
    price: 18,
    addons: ACOMPANHAMENTOS,
  },
  {
    id: "niguiri-atum",
    category: "Sashimi & Niguiri",
    name: "Niguiri de Atum (2 unidades)",
    desc: "Atum fresco com um toque de gergelim.",
    price: 20,
    addons: ACOMPANHAMENTOS,
  },

  // ---- Bebidas ----
  {
    id: "cha-verde",
    category: "Bebidas",
    name: "Chá verde gelado 400ml",
    desc: "Sem açúcar, gelado na medida.",
    price: 9,
  },
  {
    id: "refri-sushi",
    category: "Bebidas",
    name: "Refrigerante lata 350ml",
    desc: "Coca-Cola, Guaraná ou Fanta.",
    price: 7,
  },
  {
    id: "suco-sushi",
    category: "Bebidas",
    name: "Suco natural 400ml",
    desc: "Laranja, uva ou maracujá.",
    price: 12,
  },
  {
    id: "agua-sushi",
    category: "Bebidas",
    name: "Água mineral 500ml",
    desc: "Com ou sem gás.",
    price: 5,
  },
];

export const SUSHI: Menu = {
  label: "Sushi",
  to: "/sushi",
  logo: "S",
  logoImg,
  store: {
    name: "Casa Brasa Sushi",
    tagline: "Peixe fresco do dia · Combinados quentes e frios",
    whatsapp: WHATSAPP,
    deliveryFee: 9,
    minOrder: 45,
    eta: "45–70 min",
  },
  categories: [
    "Combos",
    "Enrolados",
    "Hot Rolls",
    "Temaki",
    "Sashimi & Niguiri",
    "Bebidas",
  ],
  categoryImg: {
    Combos: imgCombos,
    Enrolados: imgEnrolados,
    "Hot Rolls": imgHot,
    Temaki: imgTemaki,
    "Sashimi & Niguiri": imgSashimi,
    Bebidas: imgBebidas,
  },
  products,
  cover,
  coverAlt: "Combinado de sushi com salmão, hot rolls e temaki",
};
