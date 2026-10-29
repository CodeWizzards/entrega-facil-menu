<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

<!-- LOVABLE:BEGIN:PROJECT -->
> [!IMPORTANT]
> Cada cardápio é um módulo próprio em `src/lib` (ex.: `lanches.ts`, `sushi.ts`)
> que exporta um objeto `Menu`; todas as páginas usam o mesmo
> `src/components/Storefront.tsx` e cada cardápio ganha só um arquivo de rota
> fino com seu próprio `head()`. Isso evita duplicar o fluxo de sacola e
> WhatsApp ao adicionar um novo cardápio.
<!-- LOVABLE:END:PROJECT -->

- Featured product rails use Embla for mouse dragging, native touch gestures and click suppression after dragging; this prevents product dialogs from opening during a swipe.
- Category navigation uses its own shared Embla rail and active-category scrolling, so long menus remain reachable by mouse and touch.
- Storefront overlays use Radix Dialog for focus trapping, Escape dismissal and background scroll locking.
- Checkout validation and address formatting live in a shared browser-safe module with rule tests; a future payment handler must independently revalidate these fields and recalculate totals.
- CEP lookup uses ViaCEP with cancellation and editable fallback; browser coordinates are reverse-geocoded through the keyless Nominatim endpoint wrapped in `src/lib/place.ts` to fill city and state, and the location wizard must never present demo distances as real calculations.
- The location welcome renders its Radix overlay and content inline for server-rendered first-paint visibility; location requests must never block manual entry or overwrite it after cancellation.
- Automatic IP location uses a single browser request to get.geojs.io (started by an inline head script before the bundle loads), accepts only a valid Brazilian region, with no credentials or referrer and a bounded total timeout; server proxying would geolocate the server rather than the visitor.
- The last confirmed city is kept in the localCidade/localEstado cookies for 365 days and shown instantly on return visits; this skips the IP lookup wait without sending location anywhere.
- After the visitor confirms the city, the location modal immediately shows a fixed "1,6 km · distância" label; it is a demonstration value, never a real distance calculation.

- Pix checkout uses shared server functions, server-repriced menu data and service-only order records scoped by hashed random guest capabilities; this keeps buyer data private without requiring buyer accounts.
- Each manually requested Pix attempt uses a fresh persistent capability, previous attempts remain consultable in session history, and requests are never automatically retried; only matching server-verified transaction IDs and amounts can become PAID, preventing accidental replay and forged confirmations while allowing deliberate retries.
- Render Pix QR codes locally and retain only the checkout capability and payment display in session storage, not buyer contact or address; this limits unnecessary disclosure.
- Checkout inputs are masked on change through `src/lib/format.ts` (phone, CPF, CEP, e-mail), and the stored value keeps that format so the order message reads naturally; every validator strips non-digits first, so pasted or autofilled values still pass and the provider payload stays digits-only.
- Direct Firebot card charges transmit card fields transiently via a server function and store only guest order data and verified provider status; never persist, log, or return PAN/CVV, and clear card inputs after every submission. Production card collection requires the merchant to confirm its applicable PCI obligations and Firebot activation.
- The live-location screen draws its map as a hand-authored inline SVG (blocks, roads, street labels, route, destination pin and a courier marker moved with SMIL animateMotion); it is a labeled demonstration, never a real map, and replacing it with a real map requires a map provider plus the courier streaming their position.
- The paid-order invoice is built in the browser by `src/lib/invoice.ts` from the cart plus the server-verified paid amount, and refuses to emit when those disagree; it is always labeled demonstrative/sem validade fiscal and must never fabricate a CNPJ or a tax-authority access key, because a real NFS-e requires a registered company and a city tax issuer.

- The inline location bootstrap only starts the early request or reads confirmed cookies; React renders the city in the normal result, without a pre-hydration preview. Keep the two-second deadline and reuse the request result to avoid duplicate lookups.
