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
| Mobile Navigation (`Floating`) | `40004531:35584` | `MobileNav` |
| Mobile Nav Section Trigger | `40004531:35355` | the pill inside it, not exported |
| Mobile Navigation Popover | `40004531:35587` | its bottom sheet, not exported |
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
`<html data-nav-theme="…">`. It is not the semantic tier and does not behave like it: **all but one
of its thirty-seven modes are absolute**, so a nav on `neutral` is white in dark mode too. Only
`canvas` aliases back into the semantic layer, and it is the only mode that follows `.dark` —
measured, not assumed: `--nav-content-primary` moves between light and dark on `canvas` and holds
everywhere else.

Nine modes come from Figma and twenty-eight are derived in `generate.py`, because the Figma
collection is full. Nothing here has to know which is which — a mode is a `:root[data-nav-theme=…]`
block either way. See the tier's entry in the root `CLAUDE.md` before adding a ramp.

`canvas` was called `transparent` until 2026-09-02, and its `Background` was `Surface/Canvas` at
alpha 0. **The look did not change; the mechanism did, and `MobileNav` is why.**

The bar still reads as having no surface of its own — matching the canvas exactly is
indistinguishable from being see-through, as long as nothing is behind it. But `MobileNav`'s sheet
paints `--nav-background` too, and it opens *over* the page: at alpha 0 the sheet would have been
genuinely see-through, with the content it covers showing through the rows. Making the token a solid
colour that happens to equal the canvas keeps the transparent appearance where it is wanted and gives
the sheet something to sit on. The rename followed, because `canvas` says what the value is where
`transparent` said what it looked like.

**So this is a constraint, not an incidental value.** Do not "restore" an alpha-0 background for a
see-through nav: it would break the sheet, and the two are the same token. Verified after the change —
the sheet's background resolves to exactly `--surface-canvas`, opaque, in both themes, and the scrim
above it is what separates sheet from page.

**The `data-nav-theme` attribute value changed with it**, so any app pinning `transparent` needs the
new spelling. The two neutral modes still follow `<html data-neutral>`, because they alias Figma's
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

**The rule is centred because both sides are 8.** The space between one section's last row and the
next section's first row is the Nav Sections gap *above* the rule and the Nav Section List's own gap
*below* it. Figma briefly drew 8 above and 12 below, which put the rule high in that span; both at 8
is what "vertically centred" actually means, and it keeps each half on `spacing/2`. 10 and 10 would
have centred it inside the old 21px span too, but there is no token for 10 and inventing one for a
single gap is worse than tightening it.

**Both sides agree as of 2026-09-01.** Nathan set the Nav Section List gap to 8 in Figma, and the
collapsed variant is now 129 tall — `1 + 8 + 120`, which is exactly what this renders. That number is
the cheap way to check the two have not drifted again: if the variant is 133, the gap went back to
12.

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

**A collapsed group opens sideways.** There is nowhere to put the children in a 56px rail — a panel
would open into a column of indistinguishable icons — so the group becomes a **flyout**, on Base UI's
`Popover`, showing the rows beside the rail at the 224px they would have had in the expanded one.
Figma draws none of this; it was the gap left when the rail first landed.

`Popover` and not `Menu`, because the rows are the caller's own `NavItem`s and they stay links.
`Menu` would need each child turned into a `Menu.Item` with `role="menuitem"`, which means
transforming children the component does not own and losing `aria-current` on the way.

**Opens on hover after 200ms as well as on click.** Hover is what makes a rail browsable without
committing to a click, and the delay is what stops it firing while the pointer crosses on its way
somewhere else. Escape and an outside click close it, and so does clicking a row — which is why the
open state is held rather than left uncontrolled: a flyout still standing over the page after you
have followed a link out of it is the thing that makes this pattern feel broken.

**The panel is repainted onto the navigation tier.** `Popover`'s own surface is semantic, and the
rows inside draw with `--nav-*` — on `neutral-inverse` that is near-white text on a white panel. It
is `bg-nav-background` with `p-2` and `gap-0`, so it reads as the rail continuing outward rather than
a dialog that happens to hold links.

**The group trigger is the one collapsed row with no tooltip.** It has no children, so `NavItem` does
not wrap it — and it must not, because the tooltip and the flyout would both answer the same hover.
The panel carries the group's name in its own header instead, which says more than the tooltip did.
That header is a `span`, not `Popover.Title`: Title renders a real heading, and `SideNav.Section`
already decided group labels do not belong in the page outline. The name still reaches assistive tech
through the popup's `label`.

**`label` narrowed from `ReactNode` to `string`** for this. Collapsed, it is the trigger's whole
accessible name and the panel's as well, and neither can be built out of arbitrary nodes.

**Focus moves into the panel when it is opened by click**, so the rows are reachable straight away.
`Popover`'s own story says a popover "leaves focus on the trigger" and both are true — that one is
`defaultOpen`, where nothing the user did asked for focus. The play function asserts it, because the
first version of that test assumed the opposite and failed.

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

**No collapse or responsive menu on `TopNav`, and there will not be one.** This entry used to say
Figma drew neither and that guessing which breakpoint, and whether the list became a `Menu` or a
drawer, would put a component in the library no design agreed to. Figma has since answered — and the
answer was not a narrower `TopNav`. It is `MobileNav`: a different bar, with a section trigger and a
bottom sheet. So `TopNav` keeps its single shape, and a responsive app swaps the component rather
than collapsing this one.

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
| Collapsed group flyout | not drawn | 224 wide, `nav-background`, p-2, opens on hover at 200ms |
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

**Contrast is checked by `src/styles/nav-contrast.test.ts`, not by a sweep.** It reads the generated
stylesheet, resolves every mode's tokens back to their OKLCH literals, and measures each pair these
components actually paint — `content-primary` on all three of its grounds at 4.5:1, `content-subtle`
on the bar at 4.5:1 because a group header is 12px text, and `content-subtle` on a hovered row at
3:1 because the only thing there is the expand chevron. It exists because `npm test` runs axe at the
default nav theme only, so thirty-six of the thirty-seven modes are never rendered.

The hand sweep it replaced (46 combinations, worst 4.82 on `blue`) **had the right answer for the
wrong reason and would not have scaled.** 4.82 is `nav-content-subtle` on `blue`, which is the
*best* case in the palette, not a comfortable floor: every ramp that is lighter than blue at step
600 fails, which is thirteen of the seventeen. One ramp checked by hand cannot tell you that.

It caught one real failure on its first run, and the failure was Figma's: `pink` light at 4.16:1,
Blue's recipe on a ramp not dark enough at step 600. Fixed in Figma rather than overridden here —
`Nav Content/Subtle` now aliases `Pink/700`. See the root `CLAUDE.md` for why that direction matters.

## ResponsiveNav

`TopNav` above 768px, `MobileNav` below it — the swap `TopNav`'s record has been owing since the
family landed.

**`md:`, and the component owns it.** 768 is the library's one phone boundary; `BentoGrid` already
collapses there and its record gives the reason this follows — *the caller writes no breakpoint of
their own*. There is deliberately no `breakpoint` prop: two components disagreeing about where a
phone stops is worse than not being able to move the line.

**A CSS swap, not a `matchMedia` hook.** Both bars render and one is `display: none`, which works on
a server, through hydration, and on the first paint. A hook would render nothing until JavaScript
ran and then flash the wrong bar. It also means `tailwind-merge` has to keep `hidden md:flex`
together on `TopNav` — `hidden` replaces the base `flex`, and `md:flex` is a different variant group,
so the pair survives.

**Both bars take the same `aria-label`, and that is safe rather than sloppy.** A hidden element is
out of the accessibility tree entirely, so only one landmark is ever exposed — verified at seven
widths, exactly one visible at each, the other `display: none`. Giving them different names would
put a name in the tree that depends on the window width, which is worse.

**`pages` and `sections` are separate props on purpose.** They are not the same tree: a top bar
carries the handful of pages that fit, while the sheet carries the whole navigation — headers,
groups and all. Flattening one into the other would have to discard that structure, and a component
that silently drops content is worse than one that asks for both. The `sections` tree is the one
`SideNav` already takes, so an app with a rail has it written.

Measured: `TopNav` at 1100, 900, 800, 769 and 768; `MobileNav` at 700 and 420. `md:` is
`min-width: 768px`, so 768 itself is the wide bar and the swap happens below it.

## MobileNav

**It is the component `TopNav`'s record was waiting for.** That one left a responsive collapse undone
because which breakpoint and what it collapses into were questions Figma had not answered. It has
now, and the answer is not a narrower `TopNav` — it is a different bar, with a section trigger and a
sheet behind it. `children` are the sheet's contents, and they are the *same* `SideNav.Section` and
`NavItem` tree the rail takes, so a responsive app writes its navigation once.

**It positions itself, which nothing else in this family does.** `SideNav`, `TopNav` and `TopBar` are
all placed by the application on the grounds that a nav does not know what is beside it. A phone nav
pinned to a viewport edge is close to the definition of the thing, and Figma's example frames pin it
with constraints, so `placement` (`bottom` default, `top`) applies `fixed inset-x-2` and the 8px
inset the file draws. Agreed with Nathan as a deliberate break from the rule.

**No `w-full` on the bar, and the reason is not obvious.** `placement` pins it with `inset-x-2`, and
a width of 100% *alongside* a left/right pair over-constrains the box — the browser keeps `left`,
drops `right`, and the bar runs past the edge it was meant to be inset from. Measured that way before
it came out: 358 wide in a 358 box, hanging 7px off the right. The insets size it now.

**A second stacking layer.** `lib/layers.ts` grew `navLayer = 'z-30'`. The bar has to sit *under* the
scrim of its own sheet — Figma's bottom placement draws the open sheet covering it — so it cannot
share `overlayLayer`, and it cannot sit on `auto` either or a page's own `z-10` punches through it.
Below the popups, above the page.

**The trigger pill is the `navItem` recipe, not the `NavItem` component.** Its fill, border and
semibold label are exactly what `selected: true` draws, and Figma binds precisely those two tokens.
But `NavItem`'s `selected` also sets `aria-current="page"`, and this is a disclosure button that
opens a dialog, not the entry for the page you are on. Taking the recipe keeps the look and drops the
wrong ARIA; Base UI supplies `aria-haspopup="dialog"` and `aria-expanded` instead. Same call the
`SideNav.Group` flyout trigger makes, from the other direction.

**The sheet composes Dialog's raw parts, because `Dialog.Popup` cannot be a bottom sheet.** That
wrapper hardcodes centring on a `Viewport` that takes no `className`, so no caller can move it —
`Dialog.tsx` says the raw parts exist for "the shapes the wrappers above cannot express", and this is
one. The cost of going raw is that `overlayLayer` has to be re-applied to both fixed siblings by
hand, exactly as `DialogPopup` does; `backdrop()` and `viewport()` are imported from
`Dialog/styles.ts`, which exports them at module level even though the barrel does not.

**A visible scrim, which Figma does not draw.** The sheet is modal either way — focus trapped,
Escape closes, the page behind inert — and the dim is the only thing that shows it. Undimmed,
content that cannot be touched still looks like it can. Agreed with Nathan; it is one line
(`backdrop()`) to drop back if the file wins.

**The sheet is capped and scrolls, which Figma also does not draw.** Its popover HUGs with no max
height at all; enough sections would push it off the top of the screen, taking the first one with it.
`max-h-[85dvh]` with the sections scrolling inside. Note the `dvh` resolves against the *viewport*,
not a story's phone frame — correct on a phone, generous in Storybook.

**Named by the bar's `aria-label`, not a `Dialog.Title`.** Figma draws no title; the sheet opens
straight onto its first section header. A Title renders a real heading, which `SideNav.Section`
already declined for group labels.

**Left out deliberately:** a drag handle and drag-to-dismiss. Figma draws no grabber and Base UI's
Dialog has no drag affordance — it would be an invention, not a port.

### A disclosure inside an overlay is not a departure

Both overlays dismiss themselves when you pick a row — one still standing over the page after you
have followed a link out of it is what makes the pattern feel broken. The first version did that on
**any** click inside, which meant a `SideNav.Group` in the sheet could not be collapsed at all: it
dismissed instead of folding. Nathan found it in the sheet; the flyout had the same latent bug and is
fixed with it.

`aria-expanded` is the test, in `dismiss.ts`, and it is the right one rather than a convenience —
it is precisely the attribute marking a control as toggling something rather than going somewhere.
Anything carrying it stays; everything else is navigation and dismisses.

### The trigger is derived, not declared

`MobileNav`'s pill names where you are, and the sheet already knows: exactly one `NavItem` in it
carries `selected`. `section` and `sectionIcon` are now optional and read from that row by default.

Making the caller pass the same fact twice is how a nav ends up saying "Home" while Inbox is
highlighted — a bug nobody writes on purpose and that a duplicated prop invites. The props remain as
overrides for a label that differs from the row's own text, or a tree with no selected row; with
neither, the landmark's own name stands in rather than leaving an unnamed button.

`findSelected` recurses through `children`, so `SideNav.Section`, `SideNav.Group` and fragments all
work, and it stops at the first match. Only a **string** child is usable — anything richer is the
caller's own composition and cannot be flattened honestly.

### It fades in and slides out, and the asymmetry is the decision

The entrance was a slide from the bottom through four attempts and never read right. The exit — same
distance, same curve, same keyframes — was right the first time and every time after. That difference
is the whole finding, and it is not arbitrary: **the exit animates an element that has been on screen
all along, while the entrance animates a brand-new one.** A newly-inserted element is exactly where
transform animations are least dependable, whether driven by a transition or by keyframes, and Base
UI's `data-starting-style` exists to paper over that and was not enough here.

So the entrance is a plain fade, at Nathan's call after the fourth attempt. It is honest about what it
is, it cannot half-render, and it shares `duration-fast` with the backdrop so the scrim and the sheet
resolve together instead of one outlasting the other. The exit keeps `duration-medium`: leaving is the
motion that benefits from being readable, and it demonstrably works.

Measured: enter is `fade-in`, 175ms, opacity 0 → 1 over 22 steps with `transform: none` and the
sheet's top fixed at 359 throughout — no movement at all, which is the point. Exit is
`slide-out-to-bottom` over 50 distinct transforms.

There is deliberately no `slide-in-from-bottom` left in the token layer. It was written, it went
unused, and an unused token is worse than an absent one.

### Motion cannot be verified from here, and it cost four attempts

Three "fixed" claims were made on instruments that cannot see this animation. **Headless capture is
blind to it**: `page.screenshot` (including with `animations: 'allow'`), a paused-and-scrubbed
timeline, and a CDP screencast all showed the sheet at its settled position for the entire run, under
both a transition and keyframes. The control that proves the captures are the unreliable half — a
*static* transform on the same element renders correctly in the same tooling and moves the sheet
200px on demand.

`getComputedStyle()` and `getAnimations()` establish only that the browser *intends* to animate.
Neither is evidence that motion reaches a screen. Base UI's popup compounds it: mid-animation its
computed transform read `matrix(1,0,0,1,0,326)` while `getBoundingClientRect` stayed at the settled
359 — the signature of a compositor-promoted animation, which an isolated repro of the same CSS did
**not** show.

**A person looking at a real browser is the only check that counts for motion here.** Do not report
an animation fixed on the strength of anything in this list.

### The bar moved when the sheet opened, and it was not animating

Nathan caught this: with the bar at the **top**, opening the sheet slid the bar in as well. It looks
wrong immediately and it is worth writing down, because the bar had no animation of its own — nothing
in its own styles was ever going to explain it.

The chain, measured rather than guessed:

1. An element translated 100% out of view **still takes up layout**. Entering, the sheet hung a
   screen's height below the viewport and enlarged the scrollable area behind it: the container's
   `scrollHeight` went 678 → **1066** the instant it mounted.
2. Base UI focused the popup, so the browser scrolled to bring it into view — `scrollTop` → **388**.
3. A `fixed` element resolves against the nearest ancestor carrying a `transform`, and scrolls with
   that box. So the bar travelled with it, back down to rest as the sheet slid up and the overflow
   shrank away.

The tell that settles it: `navTop + scrollTop` was **constant** across every frame. The bar was not
sliding, it was being scrolled.

The fix is `overflow-hidden` on the Viewport, which stops the off-screen sheet creating any overflow
to scroll to. It is also just correct — a sheet has no business rendering outside the screen it is
sliding onto. Verified after: the bar holds one position across every frame of both the open and the
close, in both placements, while the sheet still runs its 39 interpolated steps in and 38 out.

**Not a story artefact, though a story is where it showed.** The phone frame's `transform` is what
made the bar resolve against a scrollable box, so portalling to `<body>` on a real phone would have
hidden it — Base UI locks body scroll. The overflow was real either way, and worth removing at the
source rather than papering over in the story.

### The measurement that nearly filed a working animation as broken

`getBoundingClientRect()` does **not** reflect the standalone `translate` property mid-transition.
Sampled in the *same* animation frames, the rect gave 3 distinct values while `getComputedStyle().translate`
gave 39 — and at the fourth frame the rect already read the settled position while the element was
still 89% off-screen. The first pass read the rect, saw two values, and concluded the sheet was
snapping into place.

Read `getComputedStyle(el).translate`, or `el.getAnimations()`, which reported two running
`CSSTransition`s (`translate` and `opacity`) over 310ms. Related, and the same family: Tailwind v4
compiles `translate-y-full` to `translate`, not `transform`, so the transition has to name
`translate` — `transition-transform` happens to work only because v4 expands it to all four.

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
SVG carries, which is what makes it follow the nav theme through every mode instead of staying
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
