# Avatar / AvatarGroup

A person as a photo, initials, or a `+N` count. Mirrors Figma nodes
`40004102:5483` (Avatar), `40004102:5619` (Avatar Status) and `40004113:14594` (Avatar Group).
Second Base UI component: wraps `Avatar` (Root / Image / Fallback) from `@base-ui/react/avatar`
for image-loading state and the delayed fallback; all styling is ours, in `styles.ts` because
the group's overflow circle draws the same shape.
`size`: x-small 20 | small 24 | base 36 | large 40 | x-large 128 — Icon's names, Figma's
XS/S/M/L/XL. Initials scale 10 / 10 / 12 / 14 / 48px.
**Content is derived, not a prop.** Figma's `Content` (Image | Initials | Overflow) follows from
what you pass: `src` → photo, `name` → initials, `count` → `+N`, none → a `User` glyph. Same
move as Button deriving icon-only from having no label.
`status`: online | offline | unavailable — each has a *shape* as well as a colour (filled disc,
ring, disc with a bar), so they survive red/green colour blindness. The dot's size is chosen by
the avatar (8 / 8 / 12 / 12 / 20), not exposed as a second knob.
Group: `<AvatarGroup size>` + `<AvatarGroup.Overflow count>`. It does **not** count for you —
you slice the list, as Astryx does.
**The trap: Figma's strokes here are *outside* strokes.** The Status "S" symbol is an 8px frame
that renders 12×12, and the group's five 36px avatars measure 164px (`5 × 36 − 4 × 4`). So the
canvas rings are `outline` (group) and `ring` (dot), never `border` — a border would eat into
the circle and shrink the photo. **164px at `base` is the number to check** when this changes.
The overlap equals the ring width, which is what leaves a clean band of canvas between circles.
**Focus:** the shared ring, which is `box-shadow` — this is the component that decides that for
the whole library. `outline` is already carrying the group ring here, and `border` would shrink
the photo, so focus had nothing else left to use.
**The one untokenised value in the library:** x-large initials get `tracking-[-0.02em]`. Figma's
`text-5xl` style carries −2% letter-spacing, but letter-spacing is not exported by the token
pipeline at all — no `--text-*--letter-spacing` in `theme.css`, no `letterSpacing` in
`tokens/dimensions.json` — so there is no token to reach for.
Two things go past Figma, both gaps in the file rather than inventions: Figma gives Avatar no
Focus state, but `href`/`onClick` make one interactive; and there is no "no data" variant, so
the `User` glyph is borrowed from the end of Astryx's fallback chain. Astryx's built-in tooltip
is left out: an avatar that needs a name should be wrapped in `Tooltip`.
