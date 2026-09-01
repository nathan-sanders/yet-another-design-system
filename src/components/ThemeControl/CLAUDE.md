# ThemeControl

The button that switches between the light and dark themes.

## Figma

| Thing | Node |
|---|---|
| Theme Control (`Theme` = Light \| Dark) | `40004486:27878` |

It is a ghost, icon-only `Button` at the default size — 32px tall, `rounded-md`, no label. That is
all the file draws, so there is no `size` and no `appearance` prop here: a toolbar that needs a
different one should reach for `Button` directly rather than have this grow options nothing asked
for.

## Decisions

**The variant names the theme you are in; the icon shows the one you would get.** `Theme=Light`
draws a moon. That reads backwards for about a second and it is right — the icon is the
*destination*, the way a play button shows a triangle while paused. The accessible name says it out
loud, "Switch to dark theme", so nobody has to infer the direction from a glyph.

**It does not touch the document, and that is the whole design.** No `classList.toggle('dark')`, no
`localStorage`, no `prefers-color-scheme` listener. A component that reaches for
`document.documentElement` has taken ownership of something the application already owns: the theme
usually has to survive a reload, sync with a stored user setting, and render on a server, and every
one of those is the app's call. This reports intent and stops. Wiring it is three lines and they
belong where the rest of the app's state lives — the `Wired` story shows them.

The honest cost: out of the box the button changes its own icon and nothing else. That looked like a
bug for a moment while building it, which is why the story says so in as many words.

**Not a `Switch`, and no `aria-pressed`.** Both would announce a control with an on state, and
neither theme is "on" — there is no off. It is a button whose action changes name, which is what a
screen reader reads either way.

**Left out: a `system` value.** Three states are a `SegmentedControl` or a `Select`, not one button.
Figma draws two variants and guessing the third would put a control in the library that no design
agreed to. If it lands, it should probably land as a different component rather than as a third
value here.

## Measured

32px tall, `rounded-md` (8), transparent (ghost), `type="button"`, no `aria-pressed`. Moon at
`theme="light"` and sun at `theme="dark"`; the uncontrolled button flips its own label from
"Switch to dark theme" to "Switch to light theme" on click.

## Figma defect, not fixed

The Button instance inside each variant is **42px wide inside a 40px component** — a 2px overhang —
and still carries a leftover `Label Text` of `"Add Policy"` with the label switched off. Neither
affects the render; both would be tidier gone.
