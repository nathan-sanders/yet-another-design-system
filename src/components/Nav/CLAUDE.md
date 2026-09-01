# Nav — NavItem, SideNav, TopNav

Three components in one folder, because `NavItem` is used by both bars and could not live in
either. The same reason `Card/styles.ts` and `Menu/styles.ts` exist.

## Figma

| Thing | Node | Became |
|---|---|---|
| Nav Item (8 variants) | `40004484:25394` | `NavItem` |
| Side Navigation (`Collapsed` × `Floating`) | `40004484:25806` | `SideNav` |
| Nav Section List (`Collapsed`) | `40004504:29320` | `SideNav.Section` |
| Nav Section Header (`Collapsed`) | `40004511:33365` | `SideNav.Section`'s `header` prop |
| Top Navigation (`Floating`) | `40004511:34404` | `TopNav` |
| Status → the `New Indicator` boolean | `40004485:27341` | `NavItem`'s `newIndicator` prop |

The file moved under this component on 2026-09-01, after the first version landed. `Nav Item` gained
a `Focus` state and split its start slot into separate `Icon` and `Avatar` booleans; `Nav Section
Header` and `Top Navigation` became component sets; both bars gained `Floating`. What follows records
the second reading, not the first.

Left for a later branch: **Top Bar** (`40004485:27759`) and **Theme Control** (`40004486:27878`).
Both draw from the *semantic* theme rather than the navigation one, and Top Bar is a page-header row
— breadcrumbs, a search field, action buttons — that happens to be drawn on the navigation page.

## The token tier

Every color here is `--nav-*`, from the `Navigation Theme` collection, switched by
`<html data-nav-theme="…">`. It is not the semantic tier and does not behave like it: **six of the
seven modes are absolute**, so a nav on `neutral` is white in dark mode too. Only `transparent`
aliases back into the semantic layer, and it is the only mode that follows `.dark` — measured, not
assumed: `--nav-content-primary` moves between light and dark on `transparent` and holds on the
other six. The two neutral modes still follow `<html data-neutral>`, because they alias Figma's
`Neutral Palette`, which is this repo's `--neutral-*` tier.

The generator's own note is in `generate.py` section 1c and in `theme.css` section 2b.

## Decisions

**`Type` became `size`.** Figma's `Type=Primary|Secondary` axis differs in exactly one thing: type
size and weight, 14/24 against 12/20. Same fills, same borders, same geometry, same everything else.
`size` is what the axis is; `type` is a DOM attribute the naming rule says has to give way. Primary
is the default, first as everywhere.

**`aria-current="page"`, not `ClickableCard`'s `true`.** That component chose `true` deliberately,
because a card is an item in a list rather than the navigation entry for the page you are on. This
is the other case — the one `page` exists for. The two notes are worth reading together.

**Figma's 1px stroke is `align: INSIDE`, so it is an `inset-ring` and not a `border`.** An inside
stroke adds nothing to a Figma frame: the selected item is 40px tall *with* its border. A CSS
`border` is part of the box, so it cannot reproduce that — measured at 42px, two over, which is how
this was caught. `inset-ring` is a box-shadow: no layout cost, follows the radius, and it removes the
need for a transparent placeholder border on the resting row to stop the item re-flowing when the
pointer arrives. Selected and unselected now measure 40px each, and 40px under hover.

That widened `tokens.test.ts` too. Its prefix list had `ring` but the lookbehind rejects a `ring`
preceded by a dash, so every `inset-ring-<token>` was being skipped in silence — the exact blind spot
the test exists to close. `inset-ring` is now in the list.

**`Floating` is only the drop shadow.** Both bars gained the axis, and it is worth saying plainly
because the name suggests more: radius, padding, fill and size are byte-for-byte identical across the
two variants. A docked bar does **not** square its corners — the docs frame shows the rail inset
inside the app window, still `rounded-lg`, just not casting onto it. `floating` defaults to `true`,
which is Figma's default and the more common case.

**The expand chevron is the one part of a row that is not `nav-content-primary`.** Figma binds its
stroke to `Nav Content/Subtle`, so it cannot inherit the row's color the way the start icon does, and
has to say so. With the section header those are the only two things in the family painted with that
token — worth knowing, because an `Icon` in a nav row otherwise takes `currentColor` and looks right
by accident. Getting this wrong is invisible in a screenshot and obvious in a diff.

**The collapsed section header is a rule, not nothing.** The first reading had the header simply
absent when collapsed; the variant is now the 1px line itself — it was briefly a 12px band holding
one — and it is what keeps the groups legible once their names are gone. It is `aria-hidden` and deliberately **not** the library's
`Divider`: that renders `role="separator"`, and an unnamed separator between two groups of links is
noise to a screen reader rather than structure — the same call Accordion made about its own item
rules.

The line is **`nav-content-subtle` at 40%**, and reading only the paint gets that wrong. Figma carries
the opacity on the Divider *instance* while the stroke underneath stays a full-strength
`Nav Content/Subtle`, so a reader that looks at `strokes[0]` alone — as the first one here did —
reports the token at 100% and misses the fade entirely. Check `node.opacity` up the chain, not just
the paint.

**The start slot is one 24px box, and the indent is a second one.** Figma's `Icon` and `Avatar`
frames are both 24×24 with the glyph centred — a 16px icon lands at 4,4 and a 20px avatar at 2,2,
which is exactly what centring gives for free. The `New Indicator` is **pinned to the top-right
corner** of that box (16,0), not laid out beside the icon, which is what the first reading had. The
indent is 24px for a reason worth keeping: `8 padding + 24 box + 4 gap` puts a child's label at the
same x as its parent's. Measured at 68px for both.

**The row gap is 4, not 8.** `spacing/1`. Easy to carry over wrong from the padding, which is 8.

**The rule is centred by making both sides 8, and Figma is not there yet.** The space between one
section's last row and the next section's first row is the Nav Sections gap *above* the rule and the
Nav Section List's own gap *below* it. Figma draws 8 above and 12 below, which puts the rule high in
that span; both at 8 is what "vertically centred" actually means, and it keeps each half on
`spacing/2`. 10 and 10 would centre it inside Figma's 21px span too, but there is no token for 10 and
inventing one for a single gap is worse than tightening it. **Figma's Nav Section List gap wants
changing from 12 to 8** for the two to agree.

That gap needs the rows in their own wrapper, which is why `SideNav.Section` renders a Pages `div`
around `children` exactly as Figma has a Pages slot. Without it, a gap meant for the space under the
header would push every row in the section apart as well.

**Three different gaps stack down the rail, and only one of them is 12.** The root is `spacing/3`
(12) between header, sections and utilities; the **Nav Sections slot is `spacing/2` (8)** between one
section and the next, in both variants; and the utilities are flush at 0. The collapsed header is
flush too — logo and toggle are two 40px squares making an 80px block with **no gap at all**, where
the expanded header is a 12px row with them pushed apart. Both the sections gap and the collapsed
header gap were 12 here at first, which is what read as too loose.

**The logo must be left-aligned, or it travels while the rail animates.** The collapsed header is a
column and the expanded one is a row, and the direction flips on the same frame the state does —
while the *width* takes 410ms to get there. With `items-center` the logo spends that whole animation
being centred in a box that is still most of 224px wide, sliding left as it shrinks; Nathan called it
out as too much movement, and it is. `items-start` pins it at x=8 from the first frame to the last —
measured across ten samples while the rail went 224 → 56, with the logo's x and y both moving zero
pixels. Figma agrees and always did: the collapsed Header's counter-axis alignment is MIN. The two
look identical at rest only because the content box ends up exactly 40 wide, which is how it went in
wrong.

**The collapse toggle is 40×40 because it has no label, not because the rail is collapsed.** It was
stretching across everything to the right of the logo: the row recipe is `w-full`, and `iconOnly` was
keyed off `collapsed` rather than off whether there is a label to show. Deriving it from the label —
the library's own rule about a value that already says it — fixes the toggle, the collapsed rail and
`TopNav`'s icon utilities with one condition.

**The toggle is tooltipped in both states, which no other row is.** Everywhere else a tooltip appears
only once the label has come off. The toggle never has a label, so at full width it is the one
control in the rail that is otherwise unexplained. `Collapse` when open and `Expand` when collapsed,
and the accessible name is the *same string* — a visible label that is not part of the accessible
name is a WCAG 2.5.3 failure, and keeping them identical makes that impossible to get wrong later.

**The collapsed rail grows a tooltip, which Figma does not draw.** A 40x40 item with its label
hidden has no accessible name at all: axe fails it, and a screen reader has nothing to read. The name
is the real requirement and the tooltip is what makes it visible to everyone else. A collapsed item
takes its `children` as both, when they are a string, and falls back to `aria-label` when they are
not — so no caller has to write the label twice. `side="right"`, out of the rail.

**The logo and the utilities are props, not children.** Figma draws both as slots rather than free
content, and it pins the utilities to the bottom — which a child cannot be relied on to do, since it
depends on being last. As props the component places them, `TopNav` takes the same two, and
`children` means one thing in both bars: the pages. Measured: with a 576px rail the utilities end at
the bottom padding, not under the last section.

**Nineteenth Base UI component — the standalone `Collapsible` the library had left out.**
`Accordion` skipped it on the grounds that "Figma draws only the accordion, and a disclosure with no
group around it is a different component". Figma has since drawn one: `Nav Item`'s `Expand` /
`Expand Open` / `Indent` booleans are a disclosure, and `SideNav.Group` is it. As in Accordion, the
open and close are one CSS transition on a height Base UI measures for us —
`--collapsible-panel-height` — so there is no JavaScript in the animation.

Base UI unmounts a closed panel, so there is nothing in the DOM to measure until it opens.

**A collapsed group flattens to a plain item.** There is nowhere to put the children in a 56px rail
— the panel would open into a column of indistinguishable icons — and Figma does not draw the case.
The trigger stays a plain row and the group's own pages are unreachable until the rail is expanded.
That is the honest behavior rather than a good one, and it is the clearest argument for the flyout
that should come next.

**`TopNav` is not built on `Tabs`, though it looks like a strip of them.** Tabs' own doc rules it
out: a set of `href` links is "a `<nav>` of anchors and a different accessibility contract" — no
`tablist`, no roving focus, `aria-current` instead of `aria-selected`. This is the component it was
handing off to.

**`aria-label` is required on both bars, by the type.** A `<nav>` is a landmark and an app with a
side rail almost always has a second one in its header; two unnamed landmarks of the same role
cannot be told apart in a screen reader's list. Required at the point where the answer is known.
`NavItem` does the same thing one level down, as a union: an item with no children cannot compile
without a label. It caught a real case while `SideNav.Group` was being written.

**Figma's `overflow-clip` is not ported** — the twelfth time. The rail does have one scrolling
region, and it needs the same care for the same reason: `overflow-y-auto` establishes a clip box and
the focus ring paints 4px outside the row. The region carries `px-1 py-1 -mx-1 -my-1`, which pushes
the clip box out by exactly that 4px and takes the space back, so the first and last rows keep a
whole ring and the layout does not move.

**`focusRing`, not `focusRingUnhovered`.** A nav item is a real tab stop, not a row that takes focus
because you pointed at it, so the `highlightItemOnHover` rule does not apply here. Verified with real
keyboard input — `:focus-visible` never matches a scripted `.focus()`, so this can only be measured
by pressing Tab.

**One thing the focus ring does not do well here, and why it was left alone.** The inner of its two
strokes is `focus/focus-inner-border`, the canvas color, so it reads as a *gap* rather than a stroke.
On an inverse nav the canvas color is not what is behind it, so the gap reads as a bright outline
instead. It stays legible and visible — not a failure — but it is not the drawing the token intends.

Figma has since added a `Focus` state, and it does **not** settle this: its `Focus Ring` instance
binds the same `Focus/Focus Inner Border` with an `Element States/Focus Outer Border` effect outside
it — two concentric strokes, which is exactly what `focusRing` already composes out of `ring` and
`ring-offset`. So the two sides agree, and they share the question. Fixing it means a nav-scoped
focus inner border, a token decision rather than a component one. Worth raising the next time the
tier is opened. (Figma draws that ring at `rounded-md` while the item is `rounded-lg`; `ring` follows
the element's own radius, which is the better answer, so it was not copied.)

**No collapse or responsive menu on `TopNav`.** Figma draws neither, and both are decisions rather
than omissions — which breakpoint, whether the list becomes a `Menu` or a drawer, what happens to the
utilities. Guessing would put a component in the library that no design agreed to.

## Measured

At `neutral-inverse` on Stone, against the Figma frames:

| | Figma | Measured |
|---|---|---|
| Item height / radius / padding / gap | 40 / 12 / 8 / 4 | 40 / 12 / 8 / 4 |
| Start slot / indent box | 24 / 24 | 24 / 24 |
| Parent vs child label x | equal | 68 / 68 |
| New indicator | 8px, top-right of the slot | 8px, offset 0,0 from that corner |
| Hover background + border | Bg Hover + Border Hover | both applied, height stable at 40 |
| Collapsed section header | the 1px rule itself | 1px, subtle @ 40% |
| Rule: space above / below | equal | 8 / 8, rows still flush at 0 |
| Logo travel during collapse | none | x and y both 0 across the 224→56 animation |
| Floating on / off | shadow / none | `shadow-low` / `none` |
| Root / sections / utilities gap | 12 / 8 / 0 | 12 / 8 / 0 |
| Collapsed header: gap, height | 0, 80 | 0, 80 |
| Collapse toggle | 40 × 40 | 40 × 40 |
| Collapsed rule | subtle @ 40%, 1px | `oklab(… / 0.4)`, 1px |
| Item type, default / small | 14/24 · 12/20 | 14/24 · 12/20, weight 600 when selected |
| Rail width, expanded / collapsed | 224 / 56 | 224 / 56 |
| Collapsed item | 40 × 40 | 40 × 40 |
| Top bar height / radius / padding | 56 / 12 / 8,12 | 56 / 12 / 8px 12px |
| Group panel | one row | settles at 40, chevron at 180° |

**Contrast: 46 mode × theme × ramp combinations, none below 4.5:1**, worst 4.82 (`nav-content-subtle`
on `blue`). Swept by compositing each token over what is actually behind it and computing the WCAG
ratio, because `npm test` runs axe only at the default ramp and none of these modes is the default.

## The frame around it

Both Figma examples (`40004487:28309`, `40004494:28818`) put the rail in an app frame with **8px of
padding and an 8px gap** — around the rail, and between it and the page. The component does not own
that and should not: a nav does not know what is beside it. The stories draw it so the composition is
the one the file shows.

## What this pulled into a neighbouring component

**`Avatar` gained a `nav` surface.** The status dot rings itself in the colour behind it so it reads
as a cut-out, and it cannot work out what that is — that is what `surface` is for. Its four values
all named `--surface-*`, so on a dark rail the default `canvas` ring was a pale disc where Figma
binds the nav `Background`. This shipped once as an arbitrary variant on the caller
(`[&_[data-status]]:ring-nav-background`), and that was the tell: a prop whose entire job is to stop
people hardcoding the ring should not need hardcoding around. `AvatarSurface` now has `nav`, wired
through all three of its maps — the group outline, the status ring and the status fill — and both
nav stories use the prop. See `Avatar/CLAUDE.md` for why a component-scoped tier is allowed in an
otherwise semantic list.

**The logo is a story fixture, not a component.** `story-logo.tsx` is the YADS wordmark, unexported
and not in the barrel: both bars take a `logo` slot precisely so the brand mark stays the
application's business. It is drawn with `fill="currentColor"` rather than the `#F5F5F5` the exported
SVG carries, which is what makes it follow the nav theme through all seven modes instead of staying
near-white on the light ones.

## Traps hit while building this

- The Browser pane runs **no rendering steps while it is hidden**. `requestAnimationFrame` never
  fires, so awaiting one hangs the call for its full timeout; and a CSS transition never leaves its
  `data-starting-style` frame, so an open panel measures 0px and a working animation reads as broken.
  Both were measured properly in real Playwright instead, which has a live clock.
- Tailwind v4's `rotate-180` sets the standalone `rotate` property, **not** `transform` — so
  `getComputedStyle(el).transform` is `none` on a chevron that is correctly rotated. `transition-transform`
  does cover it: v4 expands it to `transform, translate, scale, rotate`.
- `StoryObj<typeof meta>` cannot be used in `NavItem.stories.tsx`. Inferring args from the meta makes
  TypeScript demand every story pick an arm of the props union, so a story that only overrides
  `render` fails to compile. `StoryObj<typeof NavItem>` keeps the union's guarantee where it matters,
  at the call sites.
- The label for a `Collapsible.Trigger` has to go inside the element passed to `render`, not on the
  Trigger. Both put it in the same place at runtime, but only one is visible to the checker looking
  at `<NavItem />`.

## Figma defects, found reading and not fixed

Worth a pass of their own; none of them changes the code:

Three of the six first listed here were fixed in Figma on 2026-09-01 and are struck: the duplicate
`Top Slot Content`, the inverted `Bottom Slot` / `Bottom Slot2` pair, and the missing header node in
`Nav Section List / Collapsed=True`, which now holds the rule described above. What is left:

- **Top Bar**'s property is spelled `Breadcumbs#40004486:77`.
- **Top Bar**'s root binds `strokeBottomWeight` to `border-width/border` with an empty `strokes`
  array — a dead binding. The visible rule is the Divider child.
- All seven `Navigation Theme` variables are scoped `ALL_SCOPES`, so they appear in the spacing and
  radius pickers as well as the color ones.
