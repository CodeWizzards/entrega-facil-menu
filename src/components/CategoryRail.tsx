import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Menu } from "@/lib/menu";

export function CategoryRail({ menu, active, onSelect }: { menu: Menu; active: string | undefined; onSelect: (category: string) => void }) {
  const [ref, api] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });
  const [prev, setPrev] = useState(false);
  const [next, setNext] = useState(false);
  const update = useCallback(() => { setPrev(api?.canScrollPrev() ?? false); setNext(api?.canScrollNext() ?? false); }, [api]);
  useEffect(() => {
    if (!api) return;
    update();
    api.on("select", update).on("reInit", update);
    return () => { api.off("select", update).off("reInit", update); };
  }, [api, update]);
  useEffect(() => {
    const index = menu.categories.indexOf(active ?? "");
    if (index >= 0) api?.scrollTo(index);
  }, [active, menu.categories, api]);
  return <nav className="category-nav sticky top-0 z-30" aria-label="Categorias do cardápio">
    <Button variant="storefront" size="storefront" className="category-arrow" aria-label="Categorias anteriores" disabled={!prev} onClick={() => api?.scrollPrev()}><ChevronLeft /></Button>
    <div ref={ref} className="category-viewport"><div className="category-track">
      {menu.categories.map(category => <Button variant="storefront" size="storefront" key={category} aria-pressed={active === category} className={`category-item ${active === category ? "category-item-active" : ""}`} onClick={() => onSelect(category)}>
        <img src={menu.categoryImg[category]} alt="" draggable={false} /><span>{category}</span>
      </Button>)}
    </div></div>
    <Button variant="storefront" size="storefront" className="category-arrow" aria-label="Próximas categorias" disabled={!next} onClick={() => api?.scrollNext()}><ChevronRight /></Button>
  </nav>;
}