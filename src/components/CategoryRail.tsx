import useEmblaCarousel from "embla-carousel-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { Menu } from "@/lib/menu";

export function CategoryRail({ menu, active, onSelect }: { menu: Menu; active: string | undefined; onSelect: (category: string) => void }) {
  const [ref, api] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });
  useEffect(() => {
    const index = menu.categories.indexOf(active ?? "");
    if (index >= 0) api?.scrollTo(index);
  }, [active, menu.categories, api]);
  return <nav className="category-nav sticky top-0 z-30" aria-label="Categorias do cardápio">
    <div ref={ref} className="category-viewport"><div className="category-track">
      {menu.categories.map(category => <Button variant="storefront" size="storefront" key={category} aria-pressed={active === category} className={`category-item ${active === category ? "category-item-active" : ""}`} onClick={() => onSelect(category)}>
        <img src={menu.categoryImg[category]} alt="" draggable={false} loading="lazy" decoding="async" /><span>{category}</span>
      </Button>)}
    </div></div>
  </nav>;
}