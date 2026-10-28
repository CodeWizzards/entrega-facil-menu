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
- Automatic IP location uses browser requests to ipapi.co with ipwho.is fallback, no credentials or referrer, a bounded timeout, Brazilian-region validation and editable fallback; server proxying would geolocate the server rather than the visitor.
