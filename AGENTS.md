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
- Menu products expose CDN-backed full images and separate small thumbnails; lists and rails use thumbnails while product dialogs use full images, avoiding large downloads for tiny photos. Covers and store logos are preloaded only by their owning menu route.
- Category navigation uses its own shared Embla rail and active-category scrolling, so long menus remain reachable by mouse and touch.
- Storefront overlays use Radix Dialog for focus trapping, Escape dismissal and background scroll locking.
- Checkout validation and address formatting live in a shared browser-safe module with rule tests; a future payment handler must independently revalidate these fields and recalculate totals.
- CEP lookup uses ViaCEP with cancellation and editable fallback; browser coordinates are reverse-geocoded through the keyless Nominatim endpoint in `src/lib/place.ts`, and the location wizard must never present demo distances as real calculations.
- The location welcome renders its Radix overlay and content inline for server-rendered first-paint visibility; location requests must never block manual entry or overwrite it after cancellation.
- The last confirmed city is kept in the localCidade/localEstado cookies for 365 days and shown instantly on return visits; this skips the IP lookup wait without sending location anywhere.
- After the visitor confirms the city, the modal shows a fixed "1,6 km · distância" label: a demonstration value, never a real calculation.

- Pix checkout uses shared server functions, server-repriced menu data and service-only order records scoped by hashed random guest capabilities; this keeps buyer data private without requiring buyer accounts.
- Product Pix simulation is isolated in its own policy module and uses a dedicated transaction prefix plus an explicit test marker; this prevents testing checkout from approving real card or live-location transactions.
- The unlinked private page verifies a single server-secret credential pair and uses encrypted HttpOnly sessions; private content is returned only by a session-checked server function, never protected by URL secrecy alone.
- Private sessions use Secure, SameSite=None, Partitioned cookies outside localhost so embedded previews retain the password/TOTP challenge; preserve server-function CSRF middleware and fail visibly when the browser rejects the session.
- Before first TOTP enrollment, a short-lived password challenge may access the panel and initiate setup there; recheck enrollment server-side on every bootstrap read and setup request. Once enrolled, require password plus TOTP and never replace enrollment on login. Encrypted secrets and atomic counters prevent disclosure and code replay.
- Private finance is aggregated server-side after full session validation or a verified, unenrolled bootstrap challenge; return minimal DTOs without buyer data or capabilities, exclude test/fee rows, and leave profit unknown without costs. Disable session-header overrides.
- Each manually requested Pix attempt uses a fresh persistent capability, previous attempts remain consultable in session history, and requests are never automatically retried; only matching server-verified transaction IDs and amounts can become PAID, preventing accidental replay and forged confirmations while allowing deliberate retries.
- Render Pix QR codes locally and retain only the checkout capability and payment display in session storage, not buyer contact or address; this limits unnecessary disclosure.
- Checkout inputs are masked on change through `src/lib/format.ts` (phone, CPF, CEP, e-mail), and the stored value keeps that format so the order message reads naturally; every validator strips non-digits first, so pasted or autofilled values still pass and the provider payload stays digits-only.
- Direct Firebot card charges transmit card fields transiently via a server function and store only guest order data and verified provider status; never persist, log, or return PAN/CVV, and clear card inputs after every submission. Production card collection requires the merchant to confirm its applicable PCI obligations and Firebot activation.
- The checkout card test renders only after a held press on the security row and a server check of the private panel session; never expose it through a visible control or public route.
- The live-location screen draws its map as a hand-authored inline SVG (blocks, roads, street labels, route, destination pin and a courier marker moved with SMIL animateMotion); it is a labeled demonstration, never a real map, and replacing it with a real map requires a map provider plus the courier streaming their position.
- The paid-order receipt is built in the browser by `src/lib/invoice.ts` from the cart plus the server-verified paid amount, and refuses to emit when those disagree; call it a receipt, not a tax invoice, and never fabricate a CNPJ or a tax-authority access key.

- Automatic IP location uses one browser request to get.geojs.io, started by an inline head script before the bundle loads, accepts only a valid Brazilian region with no credentials or referrer and a two-second deadline; the bootstrap only starts that request or reads confirmed cookies, and React renders the city in the normal result. Server proxying would geolocate the server, not the visitor.
