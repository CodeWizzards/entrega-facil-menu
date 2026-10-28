import { createFileRoute } from "@tanstack/react-router";
import { Storefront } from "@/components/Storefront";
import { LANCHES } from "@/lib/lanches";
import { SUSHI } from "@/lib/sushi";

export const Route = createFileRoute("/sushi")({
  head: () => ({
    meta: [
      { title: "Casa Brasa Sushi — Combinados e hot rolls no delivery" },
      {
        name: "description",
        content:
          "Combinados de 12 a 40 peças, hot rolls crocantes, temaki e sashimi do dia. Monte seu pedido e envie pelo WhatsApp.",
      },
      { property: "og:title", content: "Casa Brasa Sushi — Delivery" },
      {
        property: "og:description",
        content:
          "Combinados, hot rolls, temaki e sashimi com peixe fresco do dia. Peça online pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StorefrontSushi,
});

function StorefrontSushi() {
  return <Storefront menu={SUSHI} other={LANCHES} />;
}
