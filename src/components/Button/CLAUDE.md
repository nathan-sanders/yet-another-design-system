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
horizontal padding* as its labelled twin, so the width follows the icon — 42×32 at default size
per Figma (node 40002016:6867), **not** a 32×32 square. It is derived from the absence of a label, not a prop, and
the props are a union so `aria-label` is *required* in that form — an unlabelled icon button will
not compile.
