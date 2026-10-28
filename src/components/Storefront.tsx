import {
  Bike,
  Check,
  Clock,
  Flame,
  Minus,
  Plus,
  Search,
  Share2,
  ShoppingBag,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { FeaturedRail } from "@/components/FeaturedRail";
import { brl, type Addon, type Menu, type Product } from "@/lib/menu";

type Item = {
  key: string;
  product: Product;
  qty: number;
  note: string;
  addons: Addon[];
};

const lineTotal = (i: Item) =>
  i.product.price + i.addons.reduce((s, a) => s + a.price, 0);

const sectionId = (c: string) => `cat-${c.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

export function Storefront({ menu }: { menu: Menu }) {
  const [cat, setCat] = useState(menu.categories[0]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const q = search.toLowerCase().trim();
  const filtered = useMemo(
    () =>
      menu.products.filter(
        (p) => !q || `${p.name} ${p.desc} ${p.category}`.toLowerCase().includes(q),
      ),
    [menu.products, q],
  );

  const subtotal = cart.reduce((s, i) => s + lineTotal(i) * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const featured = useMemo(() => menu.products.filter((p) => p.tag), [menu.products]);

  const add = (product: Product, qty: number, note: string, addons: Addon[]) =>
    setCart((c) => [...c, { key: crypto.randomUUID(), product, qty, note, addons }]);

  const jump = (c: string) => {
    setCat(c);
    setSearch("");
    searchRef.current?.blur();
    document
      .getElementById(sectionId(c))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: menu.store.name, url: window.location.href }).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="mx-auto max-w-3xl">
        <header className="relative">
          <div className="cover-wrap">
            <img
              src={menu.cover}
              alt={menu.coverAlt}
              className="block h-60 w-full object-cover md:h-80"
              width={1600}
              height={640}
            />
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <Button variant="storefront" size="storefront"
                aria-label="Buscar"
                onClick={() => searchRef.current?.focus()}
                className="icon-btn"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="storefront" size="storefront" aria-label="Compartilhar" onClick={share} className="icon-btn">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="store-card mx-3">
            <div className="logo-badge">
              <img
                src={menu.logoImg}
                alt={`Logo ${menu.store.name}`}
                className="h-full w-full object-cover"
              />
            </div>

            <h1 className="text-center font-display text-2xl font-semibold">
              {menu.store.name}
            </h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              {menu.store.tagline}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="status-pill status-open">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                Aberto
              </span>
              <span className="status-pill status-info">
                <Clock className="h-3.5 w-3.5" />
                {menu.store.eta}
              </span>
              <span className="status-pill status-info">
                <Bike className="h-3.5 w-3.5" />
                {brl(menu.store.deliveryFee)}
              </span>
              <span className="status-pill status-info">
                <ShoppingBag className="h-3.5 w-3.5" />
                Mín. {brl(menu.store.minOrder)}
              </span>
            </div>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Buscar em ${menu.label.toLowerCase()}...`}
                className="field pl-11"
              />
            </div>
          </div>
        </header>

        <nav className="category-nav sticky top-0 z-30 py-3">
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-3">
            {menu.categories.map((c) => (
              <Button variant="storefront" size="storefront"
                key={c}
                onClick={() => jump(c)}
                className={cat === c ? "cat-pill cat-pill-active" : "cat-pill bg-card"}
              >
                {c}
              </Button>
            ))}
          </div>
        </nav>

        <main className="px-3">
          {!q && featured.length > 0 && (
            <FeaturedRail menu={menu} products={featured} onSelect={setSelected} />
          )}

          {menu.categories.map((c) => {
            const items = filtered.filter((p) => p.category === c);
            if (!items.length) return null;
            return (
              <section key={c} id={sectionId(c)} className="scroll-mt-20 pt-8">
                <h2 className="px-1 font-display text-lg font-semibold">{c}</h2>
                <div className="mt-3 grid gap-2.5">
                  {items.map((p) => (
                    <Button variant="storefront" size="storefront" key={p.id} onClick={() => setSelected(p)} className="product-row">
                      <div className="min-w-0 flex-1 text-left">
                        {p.tag && (
                          <span className="tag">
                            <Flame className="h-3 w-3" />
                            {p.tag}
                          </span>
                        )}
                        <h3 className="font-semibold">{p.name}</h3>
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                          {p.desc}
                        </p>
                        <p className="mt-3 font-bold text-foreground">{brl(p.price)}</p>
                      </div>
                      <span className="product-thumb">
                        <img
                          src={menu.categoryImg[p.category]}
                          alt={p.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                        <span className="thumb-add">
                          <Plus className="h-4 w-4" />
                        </span>
                      </span>
                    </Button>
                  ))}
                </div>
              </section>
            );
          })}

          {filtered.length === 0 && (
            <p className="py-16 text-center text-muted-foreground">
              Nada encontrado para “{search}”. Tente outro nome.
            </p>
          )}

          <footer className="py-10 text-center text-xs text-muted-foreground">
            {menu.store.name} · Pedido direto no WhatsApp · Valores sujeitos a alteração
          </footer>
        </main>
      </div>

      {count > 0 && !cartOpen && (
        <Button variant="storefront" size="storefront" onClick={() => setCartOpen(true)} className="cart-fab text-left">
          <span className="flex items-center gap-3">
            <span className="relative">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            </span>
            <span>
              <span className="block text-xs text-muted-foreground">Sua sacola</span>
              <span className="block text-sm font-bold">{brl(subtotal)}</span>
            </span>
          </span>
          <span className="btn-primary py-2.5 text-sm">Ver sacola</span>
        </Button>
      )}

      {selected && (
        <ProductSheet
          menu={menu}
          product={selected}
          onClose={() => setSelected(null)}
          onAdd={add}
        />
      )}
      {cartOpen && (
        <CartSheet
          menu={menu}
          cart={cart}
          setCart={setCart}
          subtotal={subtotal}
          onClose={() => setCartOpen(false)}
        />
      )}
    </div>
  );
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-backdrop" />
        <Dialog.Content className="sheet" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">Personalizar pedido</Dialog.Title>
          <div className="sheet-grabber" />
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ProductSheet({
  menu,
  product,
  onClose,
  onAdd,
}: {
  menu: Menu;
  product: Product;
  onClose: () => void;
  onAdd: (p: Product, q: number, n: string, a: Addon[]) => void;
}) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  const chosen = product.addons?.filter((a) => picked.includes(a.id)) ?? [];
  const unit = product.price + chosen.reduce((s, a) => s + a.price, 0);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <Sheet onClose={onClose}>
      <div className="product-sheet-photo relative -mx-6 mb-5 h-52 overflow-hidden">
        <img
          src={menu.categoryImg[product.category]}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-popover to-transparent" />
        <Button variant="storefront" size="storefront"
          aria-label="Fechar"
          onClick={onClose}
          className="icon-btn absolute top-4 right-4"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {product.tag && (
        <span className="tag">
          <Flame className="h-3 w-3" />
          {product.tag}
        </span>
      )}
      <h3 className="font-display text-2xl font-semibold">{product.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{product.desc}</p>
      <p className="mt-2 text-lg font-bold text-primary">{brl(product.price)}</p>

      {product.addons && product.addons.length > 0 && (
        <>
          <div className="mt-6 mb-3 flex items-center justify-between gap-3"><p className="text-sm font-semibold">Adicionais</p><span className="text-xs text-muted-foreground">Opcional</span></div>
          <div className="addon-group">
            {product.addons.map((a) => {
              const on = picked.includes(a.id);
              return (
                <Button variant="storefront" size="storefront"
                  key={a.id}
                  aria-pressed={on}
                  onClick={() => toggle(a.id)}
                  className={on ? "addon-row addon-row-active" : "addon-row"}
                >
                  <span className="flex min-w-0 items-center gap-3 text-left">
                    <span className={on ? "check-dot check-dot-on" : "check-dot"}>
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {a.name}
                  </span>
                  <span className={on ? "shrink-0 font-bold text-primary" : "shrink-0 text-muted-foreground"}>
                    {a.price ? `+ ${brl(a.price)}` : "grátis"}
                  </span>
                </Button>
              );
            })}
          </div>
        </>
      )}

      <label className="mt-6 mb-2 block text-sm font-bold">Alguma observação?</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ex: sem cebola, ponto da carne..."
        className="field resize-none"
        rows={2}
      />

      <div className="sheet-actions mt-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <div className="stepper">
          <Button variant="storefront" size="storefront" aria-label="Diminuir" onClick={() => setQty(Math.max(1, qty - 1))}>
            <Minus className="h-4 w-4" />
          </Button>
          <span>{qty}</span>
          <Button variant="storefront" size="storefront" aria-label="Aumentar" onClick={() => setQty(qty + 1)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="storefront" size="storefront"
          className="btn-primary flex-1"
          onClick={() => {
            onAdd(product, qty, note, chosen);
            onClose();
          }}
        >
          Adicionar · {brl(unit * qty)}
        </Button>
      </div>
    </Sheet>
  );
}

function CartSheet({
  menu,
  cart,
  setCart,
  subtotal,
  onClose,
}: {
  menu: Menu;
  cart: Item[];
  setCart: React.Dispatch<React.SetStateAction<Item[]>>;
  subtotal: number;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"entrega" | "retirada">("entrega");
  const [form, setForm] = useState({ name: "", phone: "", address: "", pay: "Pix", change: "" });
  const fee = mode === "entrega" ? menu.store.deliveryFee : 0;
  const total = subtotal + fee;
  const belowMin = subtotal < menu.store.minOrder;
  const valid = Boolean(form.name && (mode === "retirada" || form.address) && !belowMin && cart.length);

  const message = useMemo(() => {
    const lines = [
      `*Novo pedido — ${menu.store.name}*`,
      "",
      ...cart.map((i) => {
        const extras = i.addons.filter((a) => a.price > 0).map((a) => a.name);
        const flavor = i.addons.filter((a) => a.price === 0).map((a) => a.name);
        return [
          `${i.qty}x ${i.product.name} — ${brl(lineTotal(i) * i.qty)}`,
          extras.length ? `   + ${extras.join(", ")}` : "",
          flavor.length ? `   Sabor: ${flavor.join(", ")}` : "",
          i.note ? `   _Obs: ${i.note}_` : "",
        ]
          .filter(Boolean)
          .join("\n");
      }),
      "",
      `Subtotal: ${brl(subtotal)}`,
      `Entrega: ${brl(fee)}`,
      `*Total: ${brl(total)}*`,
      "",
      `Nome: ${form.name}`,
      `Telefone: ${form.phone}`,
      mode === "entrega" ? `Endereço: ${form.address}` : "Retirada no local",
      `Pagamento: ${form.pay}${form.pay === "Dinheiro" && form.change ? ` (troco para ${form.change})` : ""}`,
    ];
    return lines.join("\n");
  }, [cart, form, mode, subtotal, fee, total, menu.store.name]);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value });

  return (
    <Sheet onClose={onClose}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h3 className="font-display text-2xl font-semibold">Sua sacola</h3>
        <Button variant="storefront" size="storefront" aria-label="Fechar" onClick={onClose} className="icon-btn">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {cart.length === 0 && (
        <div className="py-10 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            Sua sacola está vazia. Adicione um item do cardápio.
          </p>
        </div>
      )}

      <ul className="mt-4 grid gap-2.5">
        {cart.map((i) => (
          <li
            key={i.key}
            className="cart-item grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4 text-sm"
          >
            <div className="flex min-w-0 items-center gap-3">
              <img src={menu.categoryImg[i.product.category]} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0">
              <p className="font-semibold">
                {i.qty}x {i.product.name}
              </p>
              {i.addons.length > 0 && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {i.addons.map((a) => a.name).join(", ")}
                </p>
              )}
              {i.note && <p className="mt-0.5 text-xs text-muted-foreground">Obs: {i.note}</p>}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <p className="font-bold">{brl(lineTotal(i) * i.qty)}</p>
              <Button variant="storefront" size="storefront"
                aria-label="Remover item"
                className="icon-btn h-8 w-8 text-destructive"
                onClick={() => setCart((c) => c.filter((x) => x.key !== i.key))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="segmented mt-5">
        {(["entrega", "retirada"] as const).map((m) => (
          <Button variant="storefront" size="storefront" key={m} onClick={() => setMode(m)} className={mode === m ? "on" : ""}>
            <span className="flex items-center justify-center gap-1.5">
              {m === "entrega" ? <Bike className="h-4 w-4" /> : <Store className="h-4 w-4" />}
              {m === "entrega" ? "Entrega" : "Retirar no local"}
            </span>
          </Button>
        ))}
      </div>

      <div className="mt-3 grid gap-2.5">
        <input className="field" placeholder="Seu nome" value={form.name} onChange={set("name")} />
        <input
          className="field"
          placeholder="WhatsApp"
          value={form.phone}
          onChange={set("phone")}
        />
        {mode === "entrega" && (
          <input
            className="field"
            placeholder="Rua, número, bairro"
            value={form.address}
            onChange={set("address")}
          />
        )}
        <select className="field" value={form.pay} onChange={set("pay")}>
          <option>Pix</option>
          <option>Cartão na entrega</option>
          <option>Dinheiro</option>
        </select>
        {form.pay === "Dinheiro" && (
          <input
            className="field"
            placeholder="Troco para quanto?"
            value={form.change}
            onChange={set("change")}
          />
        )}
      </div>

      <div className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{brl(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Entrega</span>
          <span>{fee === 0 ? "Grátis" : brl(fee)}</span>
        </div>
        <div className="flex justify-between pt-1 text-base font-bold">
          <span>Total</span>
          <span className="text-primary">{brl(total)}</span>
        </div>
        {belowMin && (
          <p className="pt-1 text-xs text-destructive">
            Faltam {brl(menu.store.minOrder - subtotal)} para o pedido mínimo de{" "}
            {brl(menu.store.minOrder)}.
          </p>
        )}
      </div>

      <Button asChild variant="storefront" size="storefront"><a
        aria-disabled={!valid}
        href={valid ? `https://wa.me/${menu.store.whatsapp}?text=${encodeURIComponent(message)}` : undefined}
        target="_blank"
        rel="noreferrer"
        className={`btn-primary mt-5 block text-center ${valid ? "" : "pointer-events-none opacity-40"}`}
      >
        Enviar pedido pelo WhatsApp
      </a></Button>
    </Sheet>
  );
}
