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

## Project rules
- Shared meal/workout logs live in the `contributions` table; all signed-in users can read, only owners can insert/update/delete (enforced by RLS, not UI).
- Original design screens stay as raw HTML in `src/screens`; new data-driven pages are React routes, and the Community menu link is injected by `Screen.tsx`.
