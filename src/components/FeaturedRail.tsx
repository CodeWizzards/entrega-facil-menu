import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { brl, type Menu, type Product } from "@/lib/menu";

export function FeaturedRail({ menu, products, onSelect }: {
  menu: Menu;
  products: Product[];
  onSelect: (product: Product) => void;
}) {
  const [ref, api] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });
  const [previous, setPrevious] = useState(false);
  const [next, setNext] = useState(false);
  const update = useCallback(() => {
    setPrevious(api?.canScrollPrev() ?? false);
    setNext(api?.canScrollNext() ?? false);
  }, [api]);
  useEffect(() => {
    if (!api) return;
    update();
    api.on("select", update).on("reInit", update);
    return () => { api.off("select", update).off("reInit", update); };
  }, [api, update]);

  return <section className="pt-5" aria-label="Destaques">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-1">
      <h2 className="font-display text-lg font-semibold">Destaques</h2>
      <div className="flex shrink-0 gap-1.5">
        <Button variant="storefront" size="storefront" className="rail-arrow" aria-label="Destaques anteriores" disabled={!previous} onClick={() => api?.scrollPrev()}><ChevronLeft /></Button>
        <Button variant="storefront" size="storefront" className="rail-arrow" aria-label="Próximos destaques" disabled={!next} onClick={() => api?.scrollNext()}><ChevronRight /></Button>
      </div>
    </div>
    <div ref={ref} className="featured-viewport mt-3">
      <div className="flex gap-3">
        {products.map(product => <Button key={product.id} variant="storefront" size="storefront" onClick={() => onSelect(product)} className="featured-card">
          <span className="relative block aspect-[5/4] w-full overflow-hidden">
            <img draggable={false} src={product.imageThumb ?? product.image ?? menu.categoryImg[product.category]} alt={product.name} loading="lazy" decoding="async" width={240} height={240} className="h-full w-full object-cover" />
            <span className="thumb-add"><Plus /></span>
          </span>
          <span className="block px-3.5 pt-3 pb-4">
            <span className="block min-h-10 text-sm leading-5 font-semibold">{product.name}</span>
            <span className="mt-1 block text-sm font-bold text-foreground">{brl(product.price)}</span>
          </span>
        </Button>)}
      </div>
    </div>
  </section>;
}
