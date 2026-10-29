import { createFileRoute } from "@tanstack/react-router";
import { Storefront } from "@/components/Storefront";
import { LANCHES } from "@/lib/lanches";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [
      { rel: "preload", as: "image", href: LANCHES.cover, fetchPriority: "high" },
      { rel: "preload", as: "image", href: LANCHES.logoImg },
    ],
    meta: [
      { title: "Casa Brasa Lanches — Peça online pelo WhatsApp" },
      {
        name: "description",
        content:
          "Hamburgueria artesanal com burgers na chapa, combos, porções e sobremesas. Monte seu pedido e envie direto pelo WhatsApp.",
      },
      { property: "og:title", content: "Casa Brasa Lanches — Delivery" },
      {
        property: "og:description",
        content: "Burgers artesanais, combos e porções. Peça online pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StorefrontLanches,
});

function StorefrontLanches() {
  return <Storefront menu={LANCHES} />;
}
