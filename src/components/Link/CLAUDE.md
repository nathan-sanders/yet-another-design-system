# Link

A styled anchor for inline and standalone text navigation. Mirrors Figma node
`40004146:6709` (`State` default | hover | focus | disabled × `External Link`), documented at
`40004155:13015`. The component Button has owed the library since its `link` appearance was
deleted in #21; that entry's reasoning is this one's spec, and the `action-link-*` tokens
finally have a consumer. **The first component that is typography rather than a control**, and
the first with a real `text-decoration` — Breadcrumbs' `hover:underline` is deliberately a
different treatment, because a trail is chrome and stays `content-subtle`. This is what uses
the blue.
**It is `inline`, not `inline-flex`, and that is the whole point.** Figma draws the label and
the external arrow as an auto-layout row with a 2px gap because a canvas has no other way to
put two things side by side. Porting that as `inline-flex gap-0.5` would reintroduce the exact
defect that disqualified the Button appearance: an inline-flex box cannot break across lines,
so a link mid-paragraph would refuse to wrap. The 2px is `ms-0.5` on the arrow instead.
**Measured: a link long enough to need two lines renders as two line fragments** — that is
the check when this changes.
**`size` has no default, and inherits.** With no `size` the recipe emits no `text-*` class, so
the link takes the font-size *and* line-height of the sentence around it — measured at 12/20,
14/24 and 16/28 against paragraphs at each. Pass a step to pin it, which is what a standalone
link does: Figma draws this at `text-base`, so a nav or footer link wants `size="base"`. All
thirteen steps of the scale are variants; Astryx spells the same idea as `size` plus an
`isStandalone` boolean, and one prop covers both. Font *weight* inherits for the same reason
and is deliberately unset even though Figma binds `font-weight/normal` — a link inside a bold
heading that silently dropped to 400 would be a bug. `font-sans` **is** set, as everywhere: the
family is a library-wide constant, not typographic context.
**The underline is on an inner span, not on the anchor.** Figma underlines the label and not
the arrow, and `text-decoration` cannot be turned off for a descendant — it propagates, and the
rule is painted straight across an inline-block child's box — so the only way to end it where
the label ends is to start it there. Underlined in *every* state including hover; Figma's hover
changes color and nothing else. Figma's text style is ported whole:
`decoration-from-font`, `[text-underline-position:from-font]`, `[text-decoration-skip-ink:none]`.
**Disabled renders a `<span>`** — `<a>` has no disabled attribute and `pointer-events-none`
alone leaves it in the tab order. Breadcrumbs' answer. **`aria-disabled` on it is not
decoration:** `opacity-40` measures **1.96:1** light and **2.07:1** dark, and axe only exempts
it by walking up from the text looking for a disabled control or `aria-disabled` — Slider's
bounds-label situation exactly.
**Twelfth Base UI component, and the first that is a hook rather than a component.** There is
no Link primitive in Base UI, so this is a native `<a>` like Badge and Banner — but `useRender`
(`@base-ui/react/use-render`) supplies `render` for router integration:
`<Link render={<NextLink href="/about" />}>`. Same contract `Tooltip.Trigger` and `Menu.Trigger`
already expose to callers, so the library still has exactly one polymorphism idiom and no
`asChild`. It also picks the tag: `defaultTagName` is `'span'` when disabled and `'a'`
otherwise. **`@base-ui/react/use-render` is named in `vite.config.ts`** per the Toast rule.
`external` is one prop doing four things — the arrow, `target="_blank"`, `noopener noreferrer`
merged (not replaced) into any `rel` passed, and `sr-only` text announcing the new tab, which
`newTabLabel` localises. The arrow follows an explicit type-step → Icon-size map the way
Button's `ICON_SIZE` does, 12/16/20/24, and **stops growing at `x-large`**: an off-scale icon
size would be a second untokenised value in a library trying to keep Avatar's
`tracking-[-0.02em]` as its only one.
**The arrow is `align-middle`, 1.18px below where Figma puts it**, and that is deliberate.
Auto-layout centres it on the line box, which agrees with the text only while the line-height
does; centring on the x-height keeps it glued to the words at every step and under any leading.
**12px arrow, 2px gap, 24px line box at `base`, and 1.18px are the numbers to check.**
Focus is the shared ring, measured pixel-identical box before and after focus with the table
around it unmoved — but on **`rounded-[0.4em]`, the one place this component leaves the radius
scale**, and the library's second untokenised value after Avatar's `tracking-[-0.02em]`.
Figma binds `border-radius/rounded-md`, and 8px is wrong here twice over. An inline element's
painted box is the font's *content* box (~1.21em), not the line box: 17px at `text-base` where
a blockified link — any Link that lands in a flex container, which is most standalone ones —
gets the full 24px. 8px on 17px is 0.94 of the half-height, so the ring renders as a **pill on
exactly the case the component exists for** while its standalone twin two lines away is
properly rounded. And a px radius cannot hold its shape across thirteen steps whose box heights
are all proportional to font-size — 8px is a pill at `text-sm` and nearly square at `text-4xl`.
0.4em is derived, not eyeballed: Figma's corner is 8px on a 24px box, 0.67 of the half-height,
and reproducing that proportion on the inline box gives 0.67 × (1.21em / 2) = 0.403em. So the
inline ring is Figma's corner, at every step. One value cannot sit on both boxes, and the
inline one is what to anchor to; the blockified form comes out slightly tighter than Figma's
8px. **0.66 of the half-height on the inline box, at every step, is the number to check.**
**Wants adding to Figma:** the focus radius, as an em-relative value or as a per-size binding —
the file draws the standalone case only, so it has never had to answer this.
Seventh component on the motion tokens:
`transition-colors duration-fast-min ease-standard`. Button's bare `transition-colors` predates
the tier and is not the model.
**Contrast, measured in both themes:** blue-700 on stone-100 is **6.26:1** and hover 8.10:1;
blue-400 on stone-950 is **7.49:1** and hover 10.91:1. No `dark:` class anywhere.
**Storybook trap, worth knowing generally:** `text-action-link-foreground` had never been used
by a component, so a dev server already running when the file appeared served CSS without it
and the link rendered in the browser's default blue — a component that looks subtly wrong for a
reason that is not in its source. Reload before believing a first measurement of a brand-new
utility.
Left out: `visited` (no token, no Figma state); Astryx's `hasUnderline` (Figma underlines
always), `isStandalone` (subsumed by `size`), `tooltip` (composition — Avatar settled it, and
`<Tooltip label="…"><Link/></Tooltip>` makes the anchor itself the trigger, verified by the
`data-base-ui-tooltip-trigger` landing on the `<a>`), and `label`: `aria-label` arrives through
the spread, and on a text link you should not use it — it replaces the visible words for a
screen reader, which is the one thing a link's own text is already good at.
`lucide-react` also exports a `Link` glyph — a naming collision to alias inside stories.
