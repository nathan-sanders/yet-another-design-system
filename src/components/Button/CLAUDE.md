# Button

`appearance`: primary | secondary | destructive | ghost | overlay;
`size`: small (24px) | default (32px) | large (40px); `startIcon`/`endIcon` take a `LucideIcon`.
**No `link` appearance** — it was removed deliberately. A link navigates and belongs in an `<a>`;
a `<button>` dressed as one loses middle-click/⌘-click/"open in new tab" and announces as
"button". It is also fixed-height `inline-flex`, so it could never sit inside a sentence. It
came back as its own **Link** component, which is what the `action-link-*` tokens were
held in the theme for.
Hover/focus/disabled are CSS states, not props. Focus is the shared ring (see **Focus** above),
on `:focus-visible`. Disabled is `opacity-40`.
**Icon-only:** pass `startIcon` with no children. It keeps the same height *and the same
horizontal padding* as its labeled twin, so the width follows the icon — 42×32 at default size
per Figma (node 40002016:6867), **not** a 32×32 square. It is derived from the absence of a label, not a prop, and
the props are a union so `aria-label` is *required* in that form — an unlabeled icon button will
not compile.

## Best practices

Mirrored from the **Best practices** block on `↪ Button` (`40004242:14721`) in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Say what the button does. A verb and its object beats OK, Submit or Continue.
- Keep one primary button per view, and let everything beside it be secondary or ghost.
- Give an icon-only button an aria-label. The props are a union, so one without a label will not compile.

**Don't**

- Do not use a button to navigate. A link belongs in an anchor, which is what the Link component is for.
- Do not lean on destructive alone to signal danger. The label itself has to say what will happen.
- Do not reach past the default size. Small is for fitting inside something, large is for a page's main action.
