# Avatar / AvatarGroup

A person as a photo, initials, or a `+N` count. Mirrors Figma nodes
`40004102:5483` (Avatar), `40004102:5619` (Avatar Status) and `40004113:14594` (Avatar Group).
Second Base UI component: wraps `Avatar` (Root / Image / Fallback) from `@base-ui/react/avatar`
for image-loading state and the delayed fallback; all styling is ours, in `styles.ts` because
the group's overflow circle draws the same shape.
`size`: x-small 20 | small 24 | base 36 | large 40 | x-large 128 — Icon's names, Figma's
XS/S/M/L/XL. Initials scale 10 / 10 / 12 / 14 / 48px.
**`size` also takes a number of pixels**, as an escape hatch for a component that has to draw
an avatar at a size the scale does not have. Token is the first and so far only caller: Figma
puts a 16px avatar in its default token and a 12px one in its small token, and *neither is a
variant here or in the Figma Avatar set* — they are resized instances on the canvas. The box
takes the number through an inline `width`/`height`, which beats the `size-*` class on
specificity. Everything **derived** from the size — the initials type scale, the fallback glyph,
the status dot, the group ring — snaps to the nearest named step via `nearestAvatarSize`, because
those scales are tokenised and there is nothing continuous between their steps to interpolate to.
So a 16px avatar draws 10px initials, `x-small`'s. `AvatarGroup`'s `size` stays named-only: the
overlap is keyed to the ring width at each step, and a custom size is for one avatar whose box
something else owns, not for a row of them.
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
rings are `outline` (group) and `ring` (dot), never `border` — a border would eat into
the circle and shrink the photo. **164px at `base` is the number to check** when this changes.
The overlap equals the ring width, which is what leaves a clean band of background between circles.

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

## `surface` — the ring has to be told what is behind it

Both rings on this component are a band of the **background** showing through: the group ring
between overlapping circles, and the status dot's ring against the photo. That only works if it is
painted in the colour behind the avatar, and **CSS has no way to ask what that is** — there is no
"background of whatever contains me". So it is a prop: `canvas` (default) | `card-primary` |
`card-subtle` | `card-emphasized`, the four `--surface-*` fills the theme has. The border tokens are
not offered; `surface-border` is a line, not a fill, and nothing is drawn on top of one.

It was a hardcoded `outline-surface-canvas` until this landed, which was right on the page and
wrong everywhere else. `--surface-canvas` is `neutral-100` against a card's white in light and
`neutral-950` against its `neutral-900` in dark, so a group inside a Card or a ContentBlock drew a
grey halo around every circle instead of a gap between them. Kanban had it, and so did this
component's own `InContext` story. `statusDot` had the same assumption three times over —
`ring-surface-canvas`, the `offline` dot's fill, and the bar across `unavailable` — so the prop is
on `Avatar` as well as on the group, and travels through the same context `size` does.

**It names the token rather than inventing size words**, which is Card's `padding={3}` precedent:
when the shared vocabulary between file and code is the token, a second set of names is only a
translation table. `canvas` being the default means every call site that predates the prop kept
exactly what it had.

The `Surfaces` story draws all four, and deliberately keeps one group with the prop left off on a
card so the failure is on the record rather than in a sentence. Check it in **dark**, where the two
tokens are two different near-blacks and the mismatch is unmistakable.

## The ring width at `small` is 4px, and at `x-small` it is not

Worth writing down, because the asymmetry looks like an oversight and is not.

The `Avatar Group` symbol (`40004113:14594`) **has no Size axis** — it is five 36px avatars at
164px and nothing else. So the small end of the scale was originally a guess made in the file's
absence, on the reasonable grounds that a 4px ring leaves very little of a small avatar.

The kanban composition (`40004271:6439`) has since drawn one: three 24px avatars at **64px**, which
is `3 × 24 − 2 × 4`. That is the only place the file draws a small group and it kept 4px, so
`small` follows the file — the Accordion route, where the drawing arrives and the code moves to
meet it. `x-small` stays at 2px because nothing draws a 20px group, and 4px on a 20px avatar leaves
12px of photo. **Do not widen it for symmetry.** Widen it when the file draws one.

**The overlap and the outline only ever move together** — they are the same number, and that
identity is what leaves a clean band. Check numbers: three `small` avatars **64px**, five `base`
**164px**.

**The debt this leaves Figma:** the group needs a Size axis. Right now the only small group in the
file is a resized instance inside a composition, which is evidence but not a drawing.
