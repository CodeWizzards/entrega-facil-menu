import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Facebook,
  MapPin,
  MessagesSquare,
  PackageCheck,
  Star,
  ThumbsUp,
} from "lucide-react";
import type { Menu } from "@/lib/menu";

type Review = {
  initials: string;
  name: string;
  loc: string;
  date: string;
  score: string;
  comment: string;
};

// Avaliações de exemplo — trocar pelas reais quando a loja estiver no ar.
const REVIEWS: Record<Menu["to"], Review[]> = {
  "/": [
    {
      initials: "CM",
      name: "Carlos Mendes",
      loc: "Sorocaba, SP",
      date: "há 2 horas",
      score: "4,8",
      comment:
        "Melhor burger delivery que já experimentei! A entrega foi extremamente rápida e o lanche chegou quentinho e impecável.",
    },
    {
      initials: "AS",
      name: "Ana Silva",
      loc: "Sorocaba, SP",
      date: "há 5 horas",
      score: "5,0",
      comment:
        "Chegou super rápido, bem antes do esperado. O burger estava suculento e muito bem montado.",
    },
    {
      initials: "RL",
      name: "Rodrigo Lima",
      loc: "Sorocaba, SP",
      date: "há 9 horas",
      score: "5,0",
      comment: "Tudo muito bem feito e bem embalado! As fritas com cheddar são viciantes.",
    },
    {
      initials: "FR",
      name: "Fernanda Rocha",
      loc: "Sorocaba, SP",
      date: "há 14 horas",
      score: "5,0",
      comment:
        "Melhor custo-benefício! Porção generosa, comida deliciosa e preço justo. Recomendo para todo mundo!",
    },
    {
      initials: "MP",
      name: "Marcos Pereira",
      loc: "Sorocaba, SP",
      date: "há 20 horas",
      score: "5,0",
      comment:
        "Fiquei impressionado com a velocidade da entrega! Burger delicioso, ingredientes frescos e preço acessível. Excelente experiência!",
    },
    {
      initials: "JC",
      name: "Juliana Costa",
      loc: "Sorocaba, SP",
      date: "há 1 dia",
      score: "5,0",
      comment:
        "Perfeito para o dia a dia! Variedade no cardápio, tempero na medida certa e sempre entregam no horário.",
    },
    {
      initials: "RT",
      name: "Rafael Teixeira",
      loc: "Sorocaba, SP",
      date: "há 1 dia",
      score: "5,0",
      comment: "Bom, barato e entrega rápida. Não tem erro, semana que vem peço de novo.",
    },
    {
      initials: "IM",
      name: "Iana Martins",
      loc: "Sorocaba, SP",
      date: "há 1 dia",
      score: "5,0",
      comment: "Pedi pela primeira vez e td mundo gostou, vamos pedir mais!",
    },
  ],
  "/sushi": [
    {
      initials: "CM",
      name: "Carlos Mendes",
      loc: "Sorocaba, SP",
      date: "há 2 horas",
      score: "4,8",
      comment:
        "Melhor sushi delivery que já experimentei! A entrega foi extremamente rápida, a comida chegou impecável e muito saborosa.",
    },
    {
      initials: "AS",
      name: "Ana Silva",
      loc: "Sorocaba, SP",
      date: "há 5 horas",
      score: "5,0",
      comment:
        "Chegou super rápido, bem antes do esperado. O sushi estava fresquinho e muito bem preparado.",
    },
    {
      initials: "RL",
      name: "Rodrigo Lima",
      loc: "Sorocaba, SP",
      date: "há 9 horas",
      score: "5,0",
      comment: "Tudo muito bem feito e bem embalado! Amo comida japonesa.",
    },
    {
      initials: "FR",
      name: "Fernanda Rocha",
      loc: "Sorocaba, SP",
      date: "há 14 horas",
      score: "5,0",
      comment:
        "Melhor custo-benefício! Porção generosa, comida deliciosa e preço justo. Recomendo para todo mundo!",
    },
    {
      initials: "MP",
      name: "Marcos Pereira",
      loc: "Sorocaba, SP",
      date: "há 20 horas",
      score: "5,0",
      comment:
        "Fiquei impressionado com a velocidade da entrega! Sushi delicioso, ingredientes frescos e preço acessível. Excelente experiência!",
    },
    {
      initials: "JC",
      name: "Juliana Costa",
      loc: "Sorocaba, SP",
      date: "há 1 dia",
      score: "5,0",
      comment:
        "Perfeito para o dia a dia! Variedade no cardápio, tempero na medida certa e sempre entregam no horário.",
    },
    {
      initials: "RT",
      name: "Rafael Teixeira",
      loc: "Sorocaba, SP",
      date: "há 1 dia",
      score: "5,0",
      comment: "Bom, barato e entrega rápida. Não tem erro, semana que vem peço de novo.",
    },
    {
      initials: "IM",
      name: "Iana Martins",
      loc: "Sorocaba, SP",
      date: "há 1 dia",
      score: "5,0",
      comment: "Pedi pela primeira vez e td mundo gostou, vamos pedir mais!",
    },
  ],
};

const PERKS = [
  { icon: ThumbsUp, label: "Avaliações excelentes" },
  { icon: MessagesSquare, label: "Zero ou poucas reclamações" },
  { icon: PackageCheck, label: "Zero ou poucos cancelamentos" },
];

const PREVIEW_COUNT = 3;

function Stars() {
  return (
    <span className="super-stars" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
      ))}
    </span>
  );
}

export function SuperReviews({ menu }: { menu: Menu }) {
  const [expanded, setExpanded] = useState(false);
  const rating = menu.store.rating.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
  });
  const reviews = menu.store.reviews.toLocaleString("pt-BR");
  const all = REVIEWS[menu.to];
  const visible = expanded ? all : all.slice(0, PREVIEW_COUNT);

  return (
    <section className="pt-10" aria-label="Avaliações da loja">
      {/* Selo Super */}
      <div className="super-card">
        <div className="flex items-center gap-3">
          <span className="super-badge" aria-hidden>
            <Star className="h-4 w-4" fill="currentColor" strokeWidth={0} />
          </span>
          <span className="font-display text-base font-bold">Super</span>
          <span className="ml-auto flex items-center gap-2">
            <span className="font-display text-lg font-bold leading-none">{rating}</span>
            <span className="text-xs text-muted-foreground">/ 5</span>
            <Stars />
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          Com base nos pedidos dos últimos 3 meses,{" "}
          <strong className="font-semibold text-foreground">
            a loja está entre as melhores do delivery
          </strong>
        </p>

        <ul className="mt-4 grid gap-2.5">
          {PERKS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3">
              <span className="super-perk-icon" aria-hidden>
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <span className="text-sm">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Ponte para as avaliações */}
      <div className="mt-6 px-1">
        <h2 className="font-display text-lg font-semibold">
          Veja o que os clientes dizem
        </h2>
        <p className="text-sm text-muted-foreground">{reviews} avaliações</p>
      </div>

      {/* Avaliações */}
      <div className="mt-3 grid gap-2.5">
        {visible.map((r) => (
          <article key={r.name} className="review-card">
            <header className="flex items-center gap-3">
              <span className="review-avatar" aria-hidden>
                {r.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {r.loc}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{r.date}</span>
            </header>
            <div className="mt-2.5 flex items-center gap-2">
              <Stars />
              <span className="text-sm font-bold">{r.score}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
          </article>
        ))}
      </div>

      {/* Ações */}
      <div className="mt-3 grid gap-2.5">
        <button
          type="button"
          className="reviews-btn"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? "Ver menos avaliações" : `Ver mais avaliações`}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        <button type="button" className="reviews-btn" aria-label="Ver mais no Facebook">
          <Facebook className="h-4 w-4" aria-hidden />
          Ver mais no Facebook
        </button>
      </div>
    </section>
  );
}
