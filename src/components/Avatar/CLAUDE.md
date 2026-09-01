# Avatar / AvatarGroup

A person as a photo, initials, or a `+N` count. Mirrors Figma nodes
`40004102:5483` (Avatar), `40004102:5619` (Avatar Status) and `40004297:11406` (Avatar Group,
which gained its Size axis after this component was first built — see the ring/overlap note below).
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
those scales are tokenized and there is nothing continuous between their steps to interpolate to.
So a 16px avatar draws 10px initials, `x-small`'s. `AvatarGroup`'s `size` stays named-only: the
overlap is keyed to the ring width at each step, and a custom size is for one avatar whose box
something else owns, not for a row of them.
**Content is derived, not a prop.** Figma's `Content` (Image | Initials | Overflow) follows from
what you pass: `src` → photo, `name` → initials, `count` → `+N`, none → a `User` glyph. Same
move as Button deriving icon-only from having no label.
`status`: online | offline | unavailable — each has a *shape* as well as a color (filled disc,
ring, disc with a bar), so they survive red/green color blindness. The dot's size is chosen by
the avatar (8 / 8 / 12 / 12 / 20), not exposed as a second knob.
Group: `<AvatarGroup size>` + `<AvatarGroup.Overflow count>`. It does **not** count for you —
you slice the list, as Astryx does.
**The trap: Figma's strokes here are *outside* strokes.** The Status "S" symbol is an 8px frame
that renders 12×12, and the group's five 36px avatars measure 164px. So the
rings are `outline` (group) and `ring` (dot), never `border` — a border would eat into
the circle and shrink the photo. **164px at `base` is the number to check** when this changes.

**Focus:** the shared ring, which is `box-shadow` — this is the component that decides that for
the whole library. `outline` is already carrying the group ring here, and `border` would shrink
the photo, so focus had nothing else left to use.
**The one untokenized value in the library:** x-large initials get `tracking-[-0.02em]`. Figma's
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
painted in the color behind the avatar, and **CSS has no way to ask what that is** — there is no
"background of whatever contains me". So it is a prop: `canvas` (default) | `card-primary` |
`card-subtle` | `card-emphasized` | `nav`. The border tokens are not offered; `surface-border` is a
line, not a fill, and nothing is drawn on top of one.

**`nav` is the odd one, added 2026-09-01 for the navigation components.** The other four name
`--surface-*`, the theme-aware semantic fills; `nav` names `--nav-background`, which belongs to the
navigation theme tier and does not follow `.dark` on six of its seven modes. It is here because
`SideNav` and `TopNav` put an avatar in a nav row and Figma binds that status ring to the nav
`Background` — without it the default `canvas` ring is a pale disc on a dark rail. It went in as an
arbitrary variant on the caller first (`[&_[data-status]]:ring-nav-background`) and that was the
tell: a prop that exists so nobody hardcodes the ring should not need hardcoding around. The rule
this list follows is not "semantic tokens only" but **"fills something can sit on top of"**, and a
nav surface is one. A second component-scoped tier would join it on the same terms.

It was a hardcoded `outline-surface-canvas` until this landed, which was right on the page and
wrong everywhere else. `--surface-canvas` is `neutral-100` against a card's white in light and
`neutral-950` against its `neutral-900` in dark, so a group inside a Card or a ContentBlock drew a
gray halo around every circle instead of a gap between them. Kanban had it, and so did this
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

## The ring width and the overlap are two different numbers

The single most misleading thing about this component, and it cost two rounds to get right.

For as long as `Avatar Group` was one frame — five 36px avatars at 164px — ring and overlap were
both 4px, and the obvious reading was that they are the same quantity: *the overlap is the ring
width, so the two cancel and leave a clean band.* That sentence was in this file, in
`AvatarGroup.tsx` and in `styles.ts`, and it is **wrong**. It was one data point fitted with a
straight line.

The set now has a full Size axis (`40004297:11406`), read off the OUTSIDE stroke weights:

| size | avatar | ring | overlap | group width |
|---|---|---|---|---|
| x-small | 20 | 2 | 4 | 84 |
| small | 24 | 4 | 4 | 104 |
| base | 36 | 4 | 4 | 164 |
| large | 40 | 4 | 4 | 184 |
| x-large | 128 | 8 | 24 | 544 |

They coincide at three of five sizes, which is exactly why the coincidence was convincing.

**What each one actually does.** The **ring** is the band of background between two photos — it is
what you see. The **overlap** is how far the next circle sits into the previous one, so
`overlap + ring` is how much of a neighbor is covered. x-large stacks far harder (24 into 128)
because a 4px overlap on a circle that size would not read as a stack at all; its ring is 8px for
the same reason of scale. x-small goes the other way: a 4px overlap, but only a 2px ring, because
4px of ring on a 20px circle would eat the photo.

In CSS the negative margin is the **overlap** and the `outline` is the **ring**. `outline` costs no
layout, so the two compose exactly as they do on the canvas.

**Check number: `5 × size − 4 × overlap`** — 84 / 104 / 164 / 184 / 544. Note this is *not*
`5 × size − 4 × ring`; that only works where the two happen to be equal.

**The general lesson, which is the reason this section is long:** a component modeled off a single
Figma variant will encode coincidences as rules, and they are invisible until the axis is drawn.
When the file has one variant, say so in the comment — "this is the only size drawn" — rather than
writing the inferred relationship as though it were the design.
