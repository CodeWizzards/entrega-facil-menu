import { Home, Search, Share2, ShoppingBag } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import logoAsset from "@/assets/casa-brasa-logo.png.asset.json";
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
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-3xl">
        <header className="relative">
          <img
            src={menu.cover}
            alt={menu.coverAlt}
            className="block h-52 w-full object-cover md:h-72"
            width={1600}
            height={640}
          />
          <div className="store-card -mt-6">
            <div className="logo-badge">
              <img
                src={logoAsset.url}
                alt={`Logo ${menu.store.name}`}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute right-4 top-4 flex items-center gap-4 text-muted-foreground">
              <button
                aria-label="Buscar"
                onClick={() => searchRef.current?.focus()}
                className="transition-colors hover:text-foreground"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                aria-label="Compartilhar"
                onClick={share}
                className="transition-colors hover:text-foreground"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            <h1 className="text-center font-display text-xl font-bold">{menu.store.name}</h1>

            <div className="status-strip">
              Aberto · {menu.store.eta} · Entrega {brl(menu.store.deliveryFee)} · Pedido mínimo{" "}
              {brl(menu.store.minOrder)}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">{menu.store.tagline}</p>

            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Buscar em ${menu.label.toLowerCase()}...`}
              className="field mt-3"
            />
          </div>
        </header>

        <nav className="sticky top-0 z-10 border-b border-border bg-card">
          <div className="flex overflow-x-auto px-2">
            {menu.categories.map((c) => (
              <button
                key={c}
                onClick={() => jump(c)}
                className={cat === c ? "cat-link cat-link-active" : "cat-link"}
              >
                {c}
              </button>
            ))}
          </div>
        </nav>

        <main className="px-3">
          {menu.categories.map((c) => {
            const items = filtered.filter((p) => p.category === c);
            if (!items.length) return null;
            return (
              <section key={c} id={sectionId(c)} className="scroll-mt-14 pt-5">
                <h2 className="px-1 text-sm font-bold text-muted-foreground">{c}</h2>
                <div className="mt-2 grid gap-2">
                  {items.map((p) => (
                    <button key={p.id} onClick={() => setSelected(p)} className="product-row">
                      <div className="min-w-0 text-left">
                        {p.tag && <span className="tag">{p.tag}</span>}
                        <h3 className="font-semibold">{p.name}</h3>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{p.desc}</p>
                        <p className="mt-2 font-bold">{brl(p.price)}</p>
                      </div>
                      <span className="add-dot">+</span>
                    </button>
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

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card">
        <div className="mx-auto flex max-w-3xl">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="nav-item nav-item-active"
          >
            <Home className="h-5 w-5" />
            Início
          </button>
          <button onClick={() => setCartOpen(true)} className="nav-item relative">
            <span className="relative">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </span>
            Sacola{count > 0 ? ` · ${brl(subtotal)}` : ""}
          </button>
        </div>
      </nav>

      {selected && (
        <ProductSheet
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 md:items-center"
      onClick={onClose}
    >
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ProductSheet({
  product,
  onClose,
  onAdd,
}: {
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
      <h3 className="font-display text-xl font-bold">{product.name}</h3>
      <p className="mt-1 text-muted-foreground">{product.desc}</p>

      {product.addons && product.addons.length > 0 && (
        <>
          <p className="mt-4 text-sm font-semibold">Adicionais</p>
          <div className="mt-2 grid gap-2">
            {product.addons.map((a) => {
              const on = picked.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => toggle(a.id)}
                  className={on ? "chip chip-active justify-between" : "chip justify-between"}
                >
                  <span>{a.name}</span>
                  <span>{a.price ? `+ ${brl(a.price)}` : "escolher"}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <label className="mt-4 block text-sm font-semibold">Alguma observação?</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ex: sem cebola, ponto da carne..."
        className="field mt-1"
        rows={2}
      />

      <div className="mt-5 flex items-center gap-3">
        <div className="stepper">
          <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
          <span>{qty}</span>
          <button onClick={() => setQty(qty + 1)}>+</button>
        </div>
        <button
          className="btn-primary flex-1"
          onClick={() => {
            onAdd(product, qty, note, chosen);
            onClose();
          }}
        >
          Adicionar · {brl(unit * qty)}
        </button>
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
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-bold">Sua sacola</h3>
        <button onClick={onClose} className="text-muted-foreground">
          Fechar
        </button>
      </div>

      {cart.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Sua sacola está vazia. Adicione um item do cardápio.
        </p>
      )}

      <ul className="mt-3 divide-y divide-border">
        {cart.map((i) => (
          <li key={i.key} className="flex justify-between gap-3 py-2 text-sm">
            <div>
              <p className="font-semibold">
                {i.qty}x {i.product.name}
              </p>
              {i.addons.length > 0 && (
                <p className="text-muted-foreground">{i.addons.map((a) => a.name).join(", ")}</p>
              )}
              {i.note && <p className="text-muted-foreground">Obs: {i.note}</p>}
            </div>
            <div className="text-right">
              <p>{brl(lineTotal(i) * i.qty)}</p>
              <button
                className="text-xs text-destructive"
                onClick={() => setCart((c) => c.filter((x) => x.key !== i.key))}
              >
                Remover
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {(["entrega", "retirada"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={mode === m ? "chip chip-active justify-center" : "chip justify-center"}
          >
            {m === "entrega" ? "Entrega" : "Retirar no local"}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2">
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

      <div className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{brl(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Entrega</span>
          <span>{brl(fee)}</span>
        </div>
        <div className="flex justify-between text-base font-bold">
          <span>Total</span>
          <span>{brl(total)}</span>
        </div>
        {belowMin && (
          <p className="text-destructive">
            Faltam {brl(menu.store.minOrder - subtotal)} para o pedido mínimo de{" "}
            {brl(menu.store.minOrder)}.
          </p>
        )}
      </div>

      <a
        aria-disabled={!valid}
        href={valid ? `https://wa.me/${menu.store.whatsapp}?text=${encodeURIComponent(message)}` : undefined}
        target="_blank"
        rel="noreferrer"
        className={`btn-primary mt-4 block text-center ${valid ? "" : "pointer-events-none opacity-50"}`}
      >
        Enviar pedido pelo WhatsApp
      </a>
    </Sheet>
  );
}
