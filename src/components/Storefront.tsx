import {
  Bike,
  CreditCard,
  Check,
  Clock,
  Home,
  ReceiptText,
  Minus,
  Plus,
  Search,
  Share2,
  ShoppingBag,
  ArrowRight,
  MapPin,
  LockKeyhole,
  ShieldCheck,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { FeaturedRail } from "@/components/FeaturedRail";
import { CategoryRail } from "@/components/CategoryRail";
import { SuperReviews } from "@/components/SuperReviews";
import pixLogo from "@/assets/pix-logo.png.asset.json";
import verifiedBadge from "@/assets/optimized/verified-badge.webp.asset.json";
import { deliveryErrors, deliveryAddress, emptyDelivery, PAYMENT_METHOD, type DeliveryDetails } from "@/lib/checkout";
import { formatCep, formatCpf, formatEmail, formatPhone } from "@/lib/format";
import { ProductBadge } from "@/components/ProductBadge";
import { LocationWelcome } from "@/components/LocationWelcome";
import { lookupPostal } from "@/lib/postal";
import { brl, type Addon, type Menu, type Product } from "@/lib/menu";
import { useServerFn } from "@tanstack/react-start";
import { createPix, checkPix, chargeCard } from "@/lib/pix.functions";
import { CardFields } from "@/components/CardFields";
import { cardErrors, emptyCard } from "@/lib/card";
import { PrivateCardTest } from "@/components/PrivateCardTest";
import { readCardTestAccess } from "@/lib/private-access.functions";
import type { PixPayment } from "@/lib/pix";
import { newPixAccess, readPixAttempts, rememberPixAttempt, type PixAttempt } from "@/lib/pix-session";
import { PixPaymentPanel } from "@/components/PixPaymentPanel";
import { OrderTracking } from "@/components/OrderTracking";
import type { InvoiceLine } from "@/lib/invoice";
import { PRODUCT_PIX_TEST_MODE } from "@/lib/product-pix-test";

type PaidOrder = { lines: InvoiceLine[]; total: number; form: DeliveryDetails; payment: PixPayment; access: string };

type Item = {
  key: string;
  product: Product;
  qty: number;
  note: string;
  addons: Addon[];
};

const lineTotal = (i: Item) =>
  i.product.price + i.addons.reduce((s, a) => s + a.price, 0);

const lineCents = (i: Item) => Math.round(lineTotal(i) * 100);

const sectionId = (c: string) => `cat-${c.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

export function Storefront({ menu }: { menu: Menu }) {
  const [cat, setCat] = useState(menu.categories[0]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [payment, setPayment] = useState<PixPayment | null>(null);
  const [pixAccess, setPixAccess] = useState("");
  const [sheetMode, setSheetMode] = useState<"cart" | "orders">("cart");
  // Pedido pago fica congelado: os itens são os do momento do pagamento, não os da sacola atual.
  const [paidOrder, setPaidOrder] = useState<PaidOrder | null>(null);
  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(`pix:${menu.to}`) || "null");
      if (stored && typeof stored.access === "string" && /^[a-f0-9]{64}$/.test(stored.access)) {
        setPixAccess(stored.access);
      }
    } catch { /* Storage is optional; checkout remains available. */ }
  }, [menu.to]);
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
  const freeDelivery = menu.store.deliveryFee === 0;
  const ratingLabel = menu.store.rating.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const reviewsLabel = menu.store.reviews.toLocaleString("pt-BR");

  const add = (product: Product, qty: number, note: string, addons: Addon[]) => {
    setCart((c) => [...c, { key: crypto.randomUUID(), product, qty, note, addons }]);
  };

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
      <LocationWelcome menu={menu} />
      <div className="mx-auto max-w-3xl">
        <header className="relative">
          <div className="cover-wrap">
            <img
              src={menu.cover}
              alt={menu.coverAlt}
              className="block h-60 w-full object-cover md:h-80"
              width={1600}
              height={640}
              fetchPriority="high"
              decoding="async"
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
                width={112}
                height={112}
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>

            <h1 className="flex items-center justify-center gap-2 text-center font-display text-2xl font-semibold">
              <img src={verifiedBadge.url} alt="" aria-hidden className="verified-mark" />
              {menu.store.name}
            </h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              {menu.store.tagline}
            </p>

            <div className="store-rating mt-3">
              <Star className="rating-star" aria-hidden />
              <span className="font-bold">{ratingLabel}</span>
              <span className="text-muted-foreground">/5</span>
              <span className="rating-sep" aria-hidden />
              <span className="text-muted-foreground">
                {reviewsLabel} {menu.store.reviews === 1 ? "avaliação" : "avaliações"}
              </span>
            </div>

            <div className="store-availability mt-3">
              <span className="availability-dot" /> Aberto agora
            </div>
            <dl className="store-metrics mt-4">
              <div><dt><Clock />Tempo</dt><dd>{menu.store.eta}</dd></div>
              <div><dt><Bike />Entrega</dt><dd>{freeDelivery ? "Grátis" : brl(menu.store.deliveryFee)}</dd></div>
              <div><dt><ShoppingBag />Mínimo</dt><dd>{brl(menu.store.minOrder)}</dd></div>
            </dl>

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

        <CategoryRail menu={menu} active={cat} onSelect={jump} />

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
                          <ProductBadge label={p.tag} />
                        )}
                        <h3 className="font-semibold">{p.name}</h3>
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                          {p.desc}
                        </p>
                        <p className="mt-3 font-bold text-foreground">{brl(p.price)}</p>
                      </div>
                      <span className="product-thumb">
                        <img
                          src={p.imageThumb ?? p.image ?? menu.categoryImg[p.category]}
                          alt={p.name}
                          width={240}
                          height={240}
                          loading="lazy"
                          decoding="async"
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

          {!q && <SuperReviews menu={menu} />}

          <footer className="py-10 text-center text-xs text-muted-foreground">
            {menu.store.name} · Pedido direto no WhatsApp · Valores sujeitos a alteração
          </footer>
        </main>
      </div>

      {count > 0 && !cartOpen && (
        <Button variant="storefront" size="storefront" onClick={() => { setSheetMode("cart"); setCartOpen(true); }} className="cart-fab text-left">
          <span className="cart-launch-icon"><ShoppingBag /><span>{count}</span></span>
          <span className="min-w-0"><span className="block font-semibold">Ver sacola</span><span className="block text-xs opacity-80">{count} {count === 1 ? "item" : "itens"} · {brl(subtotal)}</span></span>
          <ArrowRight className="cart-launch-arrow" />
        </Button>
      )}

      <nav className="bottom-nav" aria-label="Navegação principal">
        <Button variant="storefront" size="storefront" className={!cartOpen ? "bottom-tab active" : "bottom-tab"} aria-current={!cartOpen ? "page" : undefined} onClick={() => {
          setCartOpen(false); setSelected(null); setSearch("");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}><Home /><span>Início</span></Button>
        <Button variant="storefront" size="storefront" aria-label="Pedidos" className={cartOpen && sheetMode === "orders" ? "bottom-tab active" : "bottom-tab"} onClick={() => { setSheetMode("orders"); setCartOpen(true); }}>
          <span className="relative"><ReceiptText />{paidOrder && <span className="tab-count">1</span>}</span><span>Pedidos</span>
        </Button>
      </nav>

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
          payment={payment}
          setPayment={setPayment}
          pixAccess={pixAccess}
          setPixAccess={setPixAccess}
          mode={sheetMode}
          paidOrder={paidOrder}
          setPaidOrder={setPaidOrder}
          onPaid={() => setSheetMode("orders")}
        />
      )}
    </div>
  );
}

function Sheet({ children, onClose, product = false }: { children: React.ReactNode; onClose: () => void; product?: boolean }) {
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-backdrop" />
        <Dialog.Content className={`sheet ${product ? "sheet-product" : ""}`} aria-describedby={undefined}>
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
    <Sheet onClose={onClose} product>
      <div className="product-sheet-photo relative -mx-6 mb-5 h-52 overflow-hidden">
        <img
          src={product.image ?? menu.categoryImg[product.category]}
          alt={product.name}
          decoding="async"
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
        <ProductBadge label={product.tag} />
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
  payment,
  setPayment,
  pixAccess,
  setPixAccess,
  mode,
  paidOrder,
  setPaidOrder,
  onPaid,
}: {
  menu: Menu;
  cart: Item[];
  setCart: React.Dispatch<React.SetStateAction<Item[]>>;
  subtotal: number;
  onClose: () => void;
  payment: PixPayment | null;
  setPayment: React.Dispatch<React.SetStateAction<PixPayment | null>>;
  pixAccess: string;
  setPixAccess: React.Dispatch<React.SetStateAction<string>>;
  mode: "cart" | "orders";
  paidOrder: PaidOrder | null;
  setPaidOrder: React.Dispatch<React.SetStateAction<PaidOrder | null>>;
  onPaid: () => void;
}) {
  const pendingOrder = useRef<PaidOrder | null>(null);
  const settle = (result: PixPayment) => {
    if (result.status === "PAID" && pendingOrder.current) {
      setPaidOrder({ ...pendingOrder.current, payment: result });
      pendingOrder.current = null;
      setCart([]);
      setPayment(null);
      onPaid();
    } else setPayment(result);
  };
  const [form, setForm] = useState<DeliveryDetails>(emptyDelivery);
  const [method, setMethod] = useState<"PIX" | "CARD">("PIX");
  const [card, setCard] = useState(emptyCard);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [attempts, setAttempts] = useState<PixAttempt[]>([]);
  useEffect(() => { setAttempts(readPixAttempts(menu.to)); }, [menu.to]);
  const createPayment = useServerFn(createPix);
  const createCardPayment = useServerFn(chargeCard);
  const checkPayment = useServerFn(checkPix);
  const savePayment = (access: string, value?: PixPayment) => {
    const next = rememberPixAttempt(attempts, access, value);
    setAttempts(next);
    try {
      sessionStorage.setItem(`pix-history:${menu.to}`, JSON.stringify(next));
      sessionStorage.setItem(`pix:${menu.to}`, JSON.stringify(next[next.length - 1]));
    } catch { /* No persistent browser storage. */ }
  };
  const verifyPayment = async () => {
    if (processing || !pixAccess) return;
    setProcessing(true); setPaymentError("");
    try { const result = await checkPayment({ data: { access: pixAccess } }); settle(result); savePayment(pixAccess, result); }
    catch (error) { setPaymentError(error instanceof Error ? error.message : "Não foi possível consultar o Pix."); }
    finally { setProcessing(false); }
  };
  // Consulta automática do Pix pendente a cada 5 segundos, sem sobrepor consultas.
  const pollRef = useRef(verifyPayment);
  pollRef.current = verifyPayment;
  const pendingPix = Boolean(pixAccess) && payment != null && !["PAID","CANCELLED","REFUNDED"].includes(payment.status) && payment.method !== "CARD";
  useEffect(() => {
    if (!pendingPix) return;
    const id = setInterval(() => { void pollRef.current(); }, 5000);
    return () => clearInterval(id);
  }, [pendingPix]);
  const [submitted, setSubmitted] = useState(false);
  const [postalStatus, setPostalStatus] = useState("");
  const [secureConnection, setSecureConnection] = useState(false);
  useEffect(() => { setSecureConnection(window.location.protocol === "https:"); }, []);
  // Teste de cartão: invisível na loja. Aparece só para quem segura a linha de segurança
  // e já tem sessão do painel reservado neste navegador, conferida no servidor.
  const [cardTestOpen, setCardTestOpen] = useState(false);
  const cardTestAllowed = useServerFn(readCardTestAccess);
  const holdTimer = useRef<number | null>(null);
  const stopHold = () => { if (holdTimer.current !== null) { clearTimeout(holdTimer.current); holdTimer.current = null; } };
  const startHold = () => {
    if (holdTimer.current !== null || cardTestOpen) return;
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      void cardTestAllowed().then(({ allowed }) => { if (allowed) setCardTestOpen(true); }).catch(() => { /* nada aparece sem sessão privada */ });
    }, 1200);
  };
  useEffect(() => stopHold, []);
  useEffect(() => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) { setPostalStatus(""); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPostalStatus("Consultando CEP…");
      try {
        const address = await lookupPostal(cep, controller.signal);
        if (controller.signal.aborted) return;
        setForm(previous => ({ ...previous, ...address }));
        setPostalStatus("Endereço encontrado. Confira os dados e informe o número.");
      } catch (error) {
        if (!controller.signal.aborted) setPostalStatus(error instanceof Error ? error.message : "Preencha o endereço manualmente.");
      }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [form.cep]);
  const errors = deliveryErrors(form);
  const fee = menu.store.deliveryFee;
  const total = subtotal + fee;
  const belowMin = subtotal < menu.store.minOrder;
  const valid = Object.keys(errors).length === 0 && !belowMin && cart.length > 0;
  const bumps = useMemo(() => {
    const inCart = new Set(cart.map(i => i.product.id));
    return menu.products
      .filter(p => /bebida|sobremesa|porç|acompanh|doce/i.test(p.category) && !inCart.has(p.id))
      .sort((a, b) => a.price - b.price)
      .slice(0, 4);
  }, [cart, menu.products]);

  const invoiceLines = useMemo<InvoiceLine[]>(() => cart.map(i => {
    const thumb = i.product.image ?? menu.categoryImg[i.product.category];
    return {
      name: i.product.name,
      qty: i.qty,
      unitCents: lineCents(i),
      addons: i.addons.map(a => a.name),
      note: i.note,
      ...(thumb ? { image: thumb } : {}),
    };
  }), [cart, menu.categoryImg]);

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
      `Entrega: ${fee === 0 ? "Grátis" : brl(fee)}`,
      `*Total: ${brl(total)}*`,
      "",
      `Nome: ${form.name}`,
      `Telefone: ${form.phone}`,
      `Endereço: ${deliveryAddress(form)}`,
      form.reference ? `Referência: ${form.reference}` : "",
       `Pagamento: ${PAYMENT_METHOD} — ${payment?.status === "PAID" ? `confirmado · Pedido ${payment.orderId}` : "aguardando pagamento"}`,
    ];
    return lines.join("\n");
   }, [cart, form, subtotal, fee, total, menu.store.name, payment]);

  // Máscaras: a pessoa vê o número no formato brasileiro enquanto digita, e o valor guardado já sai formatado.
  const masks: Partial<Record<keyof DeliveryDetails, (value: string) => string>> = { phone: formatPhone, cpf: formatCpf, cep: formatCep, email: formatEmail };
  const fieldLimits: Partial<Record<keyof DeliveryDetails, number>> = { state: 2, phone: 15, cpf: 14, cep: 9 };
  const field = (key: keyof DeliveryDetails, label: string, autoComplete?: string, optional = false) => (
    <label className="checkout-field">
      <span>{label}{optional && <span className="text-muted-foreground"> · opcional</span>}</span>
      <input className="field" aria-label={label} value={form[key]} autoComplete={autoComplete} required={!optional}
        inputMode={key === "cep" || key === "phone" || key === "cpf" ? "numeric" : key === "email" ? "email" : undefined}
        type={key === "email" ? "email" : "text"}
        maxLength={fieldLimits[key]}
        aria-invalid={submitted && Boolean(errors[key])}
        onChange={e => {
          const raw = e.target.value;
          const mask = masks[key];
          setForm(prev => ({ ...prev, [key]: key === "state" ? raw.toUpperCase() : mask ? mask(raw) : raw }));
        }} />
      {submitted && errors[key] && <span className="text-xs text-destructive">{errors[key]}</span>}
    </label>
  );

  if (mode === "orders") return (
    <Sheet onClose={onClose}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h3 className="font-display text-2xl font-semibold">Pedidos</h3>
        <Button variant="storefront" size="storefront" aria-label="Fechar" onClick={onClose} className="icon-btn"><X className="h-5 w-5" /></Button>
      </div>
      {paidOrder
        ? <OrderTracking menu={menu} payment={paidOrder.payment} form={paidOrder.form} total={paidOrder.total} lines={paidOrder.lines} orderAccess={paidOrder.access} onClose={onClose} />
        : <div className="py-10 text-center"><ReceiptText className="mx-auto h-10 w-10 text-muted-foreground/40" /><p className="mt-3 text-sm text-muted-foreground">Nenhum pedido pago ainda.</p></div>}
    </Sheet>
  );

  return (
    <Sheet onClose={onClose}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h3 className="font-display text-2xl font-semibold">Sua sacola</h3>
        <Button variant="storefront" size="storefront" aria-label="Fechar" onClick={onClose} className="icon-btn">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {cart.length === 0 && !payment && (
        <div className="py-10 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            Sua sacola está vazia. Adicione um item do cardápio.
          </p>
        </div>
      )}

      {payment?.status !== "PAID" && <ul className="mt-4 grid gap-2.5">
        {cart.map((i) => (
          <li
            key={i.key}
            className="cart-item grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4 text-sm"
          >
            <div className="flex min-w-0 items-center gap-3">
              <img src={i.product.imageThumb ?? i.product.image ?? menu.categoryImg[i.product.category]} alt="" decoding="async" width={56} height={56} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
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
                 disabled={processing || Boolean(payment)}
                 onClick={() => setCart((c) => c.filter((x) => x.key !== i.key))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>}

       {payment && payment.status !== "PAID" && payment.method !== "CARD" && <PixPaymentPanel payment={payment} checking={processing} error={paymentError} onCheck={verifyPayment} />}
       {payment?.method === "CARD" && payment.status !== "PAID" && <section className="checkout-section" aria-label="Pagamento por cartão"><h4><CreditCard /> Cartão · {brl(payment.amount)}</h4><p role="status" className="text-sm">{payment.status === "CANCELLED" ? "Pagamento recusado ou cancelado" : "Pagamento em análise. Não envie uma nova cobrança."}</p><Button variant="storefront" size="storefront" disabled={processing} onClick={verifyPayment} className="mt-3 w-full">Consultar pagamento</Button>{paymentError && <p role="alert" className="text-xs text-destructive">{paymentError}</p>}</section>}
       {!payment && paymentError && <p role="alert" className="mt-3 text-xs text-destructive">{paymentError}</p>}
       {cart.length > 0 && !payment && bumps.length > 0 && (
        <section className="order-bump" aria-label="Peça também">
          <p className="order-bump-title">Peça também</p>
          <div className="order-bump-list">
            {bumps.map(p => (
              <button key={p.id} type="button" className="order-bump-item" onClick={() => {
                const free = p.addons && p.addons.every(a => a.price === 0) ? p.addons.slice(0, 1) : [];
                setCart(c => [...c, { key: crypto.randomUUID(), product: p, qty: 1, note: "", addons: free }]);
              }}>
                <img src={p.imageThumb ?? p.image ?? menu.categoryImg[p.category]} alt="" loading="lazy" decoding="async" width={240} height={240} />
                <span className="min-w-0"><span className="order-bump-name">{p.name}</span><span className="order-bump-price">+ {brl(p.price)}</span></span>
                <span className="order-bump-add" aria-label={`Adicionar ${p.name}`}><Plus /></span>
              </button>
            ))}
          </div>
        </section>
       )}
       {cart.length > 0 && !payment && belowMin && (
        <section className="min-gate" role="status">
          <p className="min-gate-title">Faltam {brl(menu.store.minOrder - subtotal)} para finalizar</p>
          <p className="min-gate-sub">O pedido mínimo é {brl(menu.store.minOrder)}. Adicione mais itens para liberar o pagamento.</p>
          <div className="min-gate-bar"><i style={{ width: `${Math.min(100, (subtotal / menu.store.minOrder) * 100)}%` }} /></div>
          <Button variant="storefront" size="storefront" className="btn-primary mt-4 w-full" onClick={onClose}>Continuar comprando</Button>
        </section>
       )}
       {cart.length > 0 && !payment && !belowMin && <form noValidate onSubmit={async e => {
        e.preventDefault(); setSubmitted(true);
         if (!valid || processing) return;
         if (method === "CARD" && Object.keys(cardErrors(card)).length) return;
         setProcessing(true); setPaymentError("");
         const access = newPixAccess();
         setPixAccess(access); savePayment(access);
         pendingOrder.current = { lines: invoiceLines, total, form: { ...form }, access, payment: null as unknown as PixPayment };
         try {
           const data = { access, menuPath: menu.to, form, items: cart.map(i => ({ productId: i.product.id, qty: i.qty, addonIds: i.addons.map(a => a.id), note: i.note })) };
           const result = method === "CARD" ? await createCardPayment({ data: { ...data, card } }) : await createPayment({ data });
           settle(result); savePayment(access, result);
         } catch (error) { setPaymentError(error instanceof Error ? error.message : "Não foi possível gerar o Pix."); }
         finally { setProcessing(false); if (method === "CARD") setCard(emptyCard); }
      }}>
      <div className="delivery-summary mt-5">
        <span className="delivery-icon"><Bike /></span>
        <div className="min-w-0"><p className="text-sm font-semibold">Entrega no seu endereço</p><p className="mt-1 text-xs text-muted-foreground">{menu.store.eta} · {fee === 0 ? "Entrega grátis" : brl(fee)}</p></div>
        <Check className="h-4 w-4 shrink-0 text-success" />
      </div>
      {PRODUCT_PIX_TEST_MODE && method === "PIX" && <p role="status" className="mt-4 text-sm text-muted-foreground">Pix em teste · aprovação automática, sem cobrança real.</p>}
      <section className="checkout-section">
        <h4><ReceiptText /> Seus dados</h4>
         <div className="grid gap-3">{field("name", "Nome completo", "name")}{field("phone", "WhatsApp com DDD", "tel")}{field("email", "E-mail", "email")}{field("cpf", "CPF")}</div>
      </section>
      <section className="checkout-section">
        <h4><MapPin /> Endereço de entrega</h4>
        <div className="grid gap-3">
          {field("cep", "CEP", "postal-code")}
          {postalStatus && <p role="status" className="text-xs text-muted-foreground">{postalStatus}</p>}
          {field("street", "Rua / avenida", "address-line1")}
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-3">{field("number", "Número")}{field("complement", "Complemento", "address-line2", true)}</div>
          {field("neighborhood", "Bairro")}
          <div className="grid grid-cols-[minmax(0,1fr)_80px] gap-3">{field("city", "Cidade", "address-level2")}{field("state", "UF", "address-level1")}</div>
          {field("reference", "Ponto de referência", undefined, true)}
        </div>
      </section>
      <section className="checkout-section">
        <h4><ShieldCheck /> Pagamento</h4>
        <div className="grid grid-cols-2 gap-3" role="group" aria-label="Forma de pagamento"><Button type="button" variant="storefront" size="storefront" aria-pressed={method === "PIX"} className={`flex items-center justify-center gap-2 rounded-lg border p-4 ${method === "PIX" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`} onClick={() => { setMethod("PIX"); setCard(emptyCard); }}><img src={pixLogo.url} alt="" width={24} height={24} />Pix</Button><Button type="button" variant="storefront" size="storefront" aria-pressed={method === "CARD"} className={`flex items-center justify-center gap-2 rounded-lg border p-4 ${method === "CARD" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`} onClick={() => setMethod("CARD")}><span className="mini-card" aria-hidden="true"><i /></span>Cartão</Button></div>
        {method === "CARD" && <CardFields card={card} onChange={setCard} submitted={submitted} />}
        <div className="checkout-security">
          <span className="checkout-security-icon" aria-hidden="true"><LockKeyhole strokeWidth={1.7} /></span>
          <div className="min-w-0">
            <p className="checkout-security-title">{secureConnection ? "Conexão segura" : "Ambiente de teste"}</p>
          </div>

        </div>
      </section>

      <div className="mt-6 space-y-2 text-sm">
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

      {submitted && Object.keys(errors).length > 0 && <p role="alert" className="mt-4 text-xs text-destructive">Confira os campos destacados para continuar.</p>}
      <div className="sheet-actions mt-5">
         <Button type="submit" variant="storefront" size="storefront" disabled={belowMin || processing} className="btn-primary w-full gap-2">{processing ? "Processando…" : `${method === "CARD" ? "Pagar com cartão" : "Gerar Pix"} · ${brl(total)}`} <ArrowRight /></Button>
      </div>
      <div className="checkout-brand">
        <span className="checkout-brand-label">Pagamento processado com</span>
        <span className="checkout-brand-plate"><img className="checkout-brand-logo" src="/mercado-pago-logo.png" alt="Mercado Pago" width={144} height={38} loading="lazy" /></span>
      </div>

      </form>}

    </Sheet>
  );
}
