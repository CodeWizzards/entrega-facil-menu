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
- Storefront overlays use Radix Dialog for focus trapping, Escape dismissal and background scroll locking.
