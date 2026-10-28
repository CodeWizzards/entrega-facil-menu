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
- Automatic IP location races browser requests to ipapi.co and ipwho.is, accepts the first valid Brazilian region and cancels the other request, with no credentials or referrer and a bounded total timeout; this avoids waiting for a stalled primary service and server proxying would geolocate the server rather than the visitor.
- Pix checkout uses shared server functions, server-repriced menu data and service-only order records scoped by hashed random guest capabilities; this keeps buyer data private without requiring buyer accounts.
- Each Pix attempt has a unique persistent capability, is never automatically retried after an ambiguous provider result, and only matching server-verified transaction IDs and amounts can become PAID; this prevents duplicate charges and browser-forged confirmations.
- Render Pix QR codes locally and retain only the checkout capability and payment display in session storage, not buyer contact or address; this limits unnecessary disclosure.
- Checkout inputs are masked on change through `src/lib/format.ts` (phone, CPF, CEP, e-mail), and the stored value keeps that format so the order message reads naturally; every validator strips non-digits first, so pasted or autofilled values still pass and the provider payload stays digits-only.
