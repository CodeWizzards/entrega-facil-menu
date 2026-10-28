import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import cover from "@/assets/cover.jpg";
import { CATEGORIES, PRODUCTS, STORE, brl, type Product } from "@/lib/menu";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${STORE.name} — Peça online` },
      { name: "description", content: "Cardápio digital com pedido direto pelo WhatsApp." },
      { property: "og:title", content: `${STORE.name} — Delivery` },
      { property: "og:description", content: "Escolha, monte seu pedido e envie pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Store,
});

type Item = { key: string; product: Product; qty: number; note: string };

function Store() {
  const [cat, setCat] = useState(CATEGORIES[0]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const filtered = PRODUCTS.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  const add = (product: Product, qty: number, note: string) =>
    setCart((c) => [...c, { key: crypto.randomUUID(), product, qty, note }]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative">
        <img src={cover} alt="Mesa com petiscos e chopp" className="h-48 w-full object-cover md:h-64" width={1600} height={640} />
        <div className="mx-auto -mt-12 max-w-3xl px-4">
          <div className="store-card">
            <div className="flex items-center gap-4">
              <div className="logo-badge">M</div>
              <div>
                <h1 className="font-display text-2xl font-bold">{STORE.name}</h1>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-success">● Aberto</span> · {STORE.eta} · Entrega {brl(STORE.deliveryFee)}
                </p>
                <p className="text-xs text-muted-foreground">Pedido mínimo {brl(STORE.minOrder)}</p>
              </div>
            </div>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar no cardápio..." className="field mt-4" />
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-10 mt-4 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-3">
          {CATEGORIES.map((c) => (
            <a key={c} href={`#${c}`} onClick={() => setCat(c)} className={cat === c ? "chip chip-active" : "chip"}>{c}</a>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4">
        {CATEGORIES.map((c) => {
          const items = filtered.filter((p) => p.category === c);
          if (!items.length) return null;
          return (
            <section key={c} id={c} className="scroll-mt-16 pt-6">
              <h2 className="font-display mb-3 text-lg font-bold">{c}</h2>
              <div className="grid gap-3">
                {items.map((p) => (
                  <button key={p.id} onClick={() => setSelected(p)} className="product-row">
                    <div className="text-left">
                      <h3 className="font-semibold">{p.name}</h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{p.desc}</p>
                      <p className="mt-2 font-bold text-primary">{brl(p.price)}</p>
                    </div>
                    <span className="add-dot">+</span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {count > 0 && (
        <button onClick={() => setCartOpen(true)} className="cart-bar">
          <span className="rounded-md bg-primary-foreground/20 px-2 py-0.5 text-sm">{count}</span>
          <span>Ver sacola</span>
          <span>{brl(subtotal)}</span>
        </button>
      )}

      {selected && <ProductSheet product={selected} onClose={() => setSelected(null)} onAdd={add} />}
      {cartOpen && <CartSheet cart={cart} setCart={setCart} subtotal={subtotal} onClose={() => setCartOpen(false)} />}
    </div>
  );
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 md:items-center" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function ProductSheet({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (p: Product, q: number, n: string) => void }) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  return (
    <Sheet onClose={onClose}>
      <h3 className="font-display text-xl font-bold">{product.name}</h3>
      <p className="mt-1 text-muted-foreground">{product.desc}</p>
      <label className="mt-4 block text-sm font-semibold">Alguma observação?</label>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: sem cebola" className="field mt-1" rows={2} />
      <div className="mt-5 flex items-center gap-3">
        <div className="stepper">
          <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
          <span>{qty}</span>
          <button onClick={() => setQty(qty + 1)}>+</button>
        </div>
        <button className="btn-primary flex-1" onClick={() => { onAdd(product, qty, note); onClose(); }}>
          Adicionar · {brl(product.price * qty)}
        </button>
      </div>
    </Sheet>
  );
}

function CartSheet({ cart, setCart, subtotal, onClose }: { cart: Item[]; setCart: React.Dispatch<React.SetStateAction<Item[]>>; subtotal: number; onClose: () => void }) {
  const [mode, setMode] = useState<"entrega" | "retirada">("entrega");
  const [form, setForm] = useState({ name: "", phone: "", address: "", pay: "Pix", change: "" });
  const fee = mode === "entrega" ? STORE.deliveryFee : 0;
  const total = subtotal + fee;
  const belowMin = subtotal < STORE.minOrder;
  const valid = form.name && (mode === "retirada" || form.address) && !belowMin && cart.length;

  const message = useMemo(() => {
    const lines = [
      `*Novo pedido — ${STORE.name}*`, "",
      ...cart.map((i) => `${i.qty}x ${i.product.name} — ${brl(i.product.price * i.qty)}${i.note ? `\n   _Obs: ${i.note}_` : ""}`),
      "", `Subtotal: ${brl(subtotal)}`, `Entrega: ${brl(fee)}`, `*Total: ${brl(total)}*`, "",
      `Nome: ${form.name}`, `Telefone: ${form.phone}`,
      mode === "entrega" ? `Endereço: ${form.address}` : "Retirada no local",
      `Pagamento: ${form.pay}${form.pay === "Dinheiro" && form.change ? ` (troco p/ ${form.change})` : ""}`,
    ];
    return lines.join("\n");
  }, [cart, form, mode, subtotal, fee, total]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-bold">Sua sacola</h3>
        <button onClick={onClose} className="text-muted-foreground">Fechar</button>
      </div>
      <ul className="mt-3 divide-y divide-border">
        {cart.map((i) => (
          <li key={i.key} className="flex justify-between gap-3 py-2 text-sm">
            <div>
              <p className="font-semibold">{i.qty}x {i.product.name}</p>
              {i.note && <p className="text-muted-foreground">Obs: {i.note}</p>}
            </div>
            <div className="text-right">
              <p>{brl(i.product.price * i.qty)}</p>
              <button className="text-xs text-destructive" onClick={() => setCart((c) => c.filter((x) => x.key !== i.key))}>Remover</button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {(["entrega", "retirada"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={mode === m ? "chip chip-active justify-center" : "chip justify-center"}>
            {m === "entrega" ? "Entrega" : "Retirar no local"}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-2">
        <input className="field" placeholder="Seu nome" value={form.name} onChange={set("name")} />
        <input className="field" placeholder="WhatsApp" value={form.phone} onChange={set("phone")} />
        {mode === "entrega" && <input className="field" placeholder="Rua, número, bairro" value={form.address} onChange={set("address")} />}
        <select className="field" value={form.pay} onChange={set("pay")}>
          <option>Pix</option><option>Cartão na entrega</option><option>Dinheiro</option>
        </select>
        {form.pay === "Dinheiro" && <input className="field" placeholder="Troco para quanto?" value={form.change} onChange={set("change")} />}
      </div>

      <div className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
        <div className="flex justify-between"><span>Entrega</span><span>{brl(fee)}</span></div>
        <div className="flex justify-between text-base font-bold"><span>Total</span><span>{brl(total)}</span></div>
        {belowMin && <p className="text-destructive">Pedido mínimo de {brl(STORE.minOrder)}.</p>}
      </div>
      <a
        aria-disabled={!valid}
        href={valid ? `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}` : undefined}
        target="_blank" rel="noreferrer"
        className={`btn-primary mt-4 block text-center ${valid ? "" : "pointer-events-none opacity-50"}`}
      >
        Enviar pedido pelo WhatsApp
      </a>
    </Sheet>
  );
}
