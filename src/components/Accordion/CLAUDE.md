# Accordion

A stack of sections, each opening to reveal its own content. The eighteenth Base UI component.

**Figma:** "Accordion" `40004084:2278`, "Accordion Item" `40004079:231` (`Panel Open` True/False),
"Accordion Trigger" `40004078:137` (`State` Default / Hover / Focus / Disabled), all under the
Components section `40004075:20965`.

## API

```tsx
<Accordion defaultValue={['shipping']}>
  <Accordion.Item value="shipping">
    <Accordion.Trigger startIcon={Truck}>Delivery</Accordion.Trigger>
    <Accordion.Panel>Two to three working days.</Accordion.Panel>
  </Accordion.Item>
</Accordion>
```

Root takes `multiple`, `value` / `defaultValue` (arrays), `onValueChange`, `disabled`,
`keepMounted`, `hiddenUntilFound`, plus two of ours: `container` and `headingLevel`.

## The animation is a measurement, not a library

Root `CLAUDE.md` says to check whether the headless primitive already measures the thing before
assuming an animation needs JavaScript — the lesson the Tabs indicator taught. It does here too.
Base UI measures each panel and publishes it as `--accordion-panel-height`, so the whole open and
close is `height: var(--accordion-panel-height)` plus `overflow: hidden`, collapsing to `h-0` under
`data-[starting-style]` and `data-[ending-style]`.

**175ms `ease-standard` on both the panel and the chevron.** `duration-fast` is the token Astryx
gives its own collapsible chevron. Toast — the library's only other height animation — uses
`duration-medium-min` (310ms), and that was the alternative; running the panel and the chevron on
one duration means they finish together, and a chevron that lands early beside a still-opening
panel is what reads as broken. Colour stays on `duration-fast-min`, as everywhere else.

Astryx does **not** animate its collapsible's height at all — it is a `display: none` toggle, with
only the chevron moving. That is the one part of its spec deliberately not copied.

## Only the Panel clips

Figma's `overflow-clip` is not ported, for the tenth time — the focus ring paints outside the
component and a clipped card would slice it off. The root turns out not to need it anyway: items
draw no background of their own, and the trigger's hover fill nests exactly, because **the root's
12px radius less the header's 4px padding is the trigger's 8px**. That is what those three numbers
in Figma are for, and it is the thing to preserve if any of them change.

The Panel is the standing exception, and the one place the clip does real work: without it the
content is visible outside a collapsing box and there is no animation to see. Measured: a Link
inside an open panel keeps its full focus ring, because the panel is at its measured height by then
and the 16/8/16 padding is wider than the ring's 5px.

**The panel's padding is on an inner box, not on the panel.** The panel's height is the animated
property, so anything adding to it has to be inside the measured element.

## Base UI notes

- **Arrow keys deliberately do nothing.** 1.7.0 deprecated `orientation` and `loopFocus` to no-ops
  after the [APG update](https://github.com/w3c/aria-practices/pull/3434) removed roving focus from
  accordions; every trigger is its own tab stop. Both are `Omit`ted from the wrapper rather than
  passed through, so nobody sets one and waits — the same call Tabs made on vertical orientation.
- **Multi-open is `multiple`, not `openMultiple`.** The latter was the pre-1.0 name and is gone.
- **No ARIA to patch**, unlike Tooltip. The Trigger is a real `<button>` with `aria-expanded` and
  `aria-controls`, the Header a real `<h3>`. `aria-controls` appears only while the panel is
  mounted, which is correct — a closed panel with no `keepMounted` is not in the DOM to point at.
- **Disabled is `aria-disabled`, not the native attribute.** Measured: a disabled item's trigger has
  `aria-disabled="true"`, `tabIndex` 0 and `disabled === false`, so it stays announced rather than
  vanishing from the tab order. Which means `data-disabled:` is the only hook that works —
  `:disabled` would match nothing at all, silently. Same trap as Tabs.
- **The `hidden` guard in Base UI's demo is not copied.** Their `[hidden]:not([hidden=until-found])`
  rule exists because their panel sets `display: flex`, which beats the browser's own
  `[hidden] { display: none }`. This panel sets no display, so the browser already handles it —
  measured both ways: a bare `hidden` computes to `none`, `until-found` stays `block`.

## Our two props

**`container`** — Figma draws the accordion as a card, and that is the default. `false` drops the
border and radius so items sit flush inside something that draws its own frame. Tabs' `divider` is
the same idea. Will matter as soon as Card lands.

**`headingLevel`** (2–6, default 3) — set once on the root and read through context, so two sections
of one accordion cannot disagree. An accordion is a set of sections and its triggers belong in the
page outline, but only the page knows at what depth; a level that skips one is an axe
`heading-order` failure rather than a matter of taste. Base UI's Header renders `<h3>`, and anything
else is a `render` swap, so the levels are an explicit map. The `<h3>` also needs `m-0` — the
browser margin would push every row apart.

## Left out

- **A standalone `Collapsible`.** Base UI ships one and Astryx builds its accordion out of it, but
  Figma draws only the accordion, and a disclosure with no group around it is a different component
  rather than this one with a prop off.
- **Astryx's `density` scale** (compact / balanced / spacious). Figma draws one row height.
- **Astryx's `aria-disabled` + `tabIndex={-1}` disabled treatment**, chosen there so a wrapping
  tooltip still gets hover. A real improvement, but Base UI's `disabled` owns that wiring — and as
  it happens Base UI already uses `aria-disabled` here, so the gap is smaller than it looks.
- **Panel typography.** Figma leaves the panel an empty slot and `Tabs.Panel` sets none either: what
  goes in a panel is the caller's content.

## Measured

In Storybook at 1440×900, light and dark:

- Root radius 12px, 1px `surface-border`, `overflow: visible`; item divider 1px, last item 0.
- Header `<h3>`, padding 4px, margin 0. Trigger min-height 32px (renders at 32), radius 8px,
  padding-inline 12px, gap 8px, 14/24 at weight 600, `content-emphasized`.
- Panel `overflow: hidden`, inner padding 8/16/16, gap 8; `--accordion-panel-height` 96px on a
  two-line panel, and the height interpolates 0 → 96 over `height 0.175s cubic-bezier(0.24,1,0.4,1)`.
- Chevron 16px, `rotate` 0 → 180deg, same 175ms and curve. Note Tailwind v4 compiles `rotate-180` to
  the **`rotate` property, not `transform`** — reading `transform` shows `none` on a working
  chevron, exactly as it compiles `translate-x-*` to `translate` for the Tabs indicator.
- Focus ring on a real Tab press: `:focus-visible` matches, `box-shadow` is white at 2px then
  `oklch(0.444 …)` at 5px — the 2px gap plus 3px ring — following the trigger's 8px radius, unclipped.
- Disabled trigger at `opacity: 0.4`, `pointer-events: none`.
- `hiddenUntilFound`: all panels in the DOM with `hidden="until-found"` and
  `content-visibility: hidden`, their text still findable.

**Measuring this component in the Browser pane needs care.** `document.hidden` is true there and
`requestAnimationFrame` never runs, which is worse than the usual frozen-transition problem: Base UI
clears `data-starting-style` in a rAF, so a panel opened by clicking **never leaves its starting
style** and sits at `height: 0` forever, looking like a broken component. The tell is
`getAnimations()` reporting `playState: "running"` with `currentTime: 0`. Remove
`data-starting-style` by hand, then call `.finish()` on the animations, and the height lands on its
measured value. A first-render measurement — the `DefaultOpen` story — is always trustworthy.

## Stories

`Playground`, `Container`, `States`, `WithIcons`, `Multiple`, `DefaultOpen`, `FindInPage`,
`InContext`. **`DefaultOpen` is load-bearing:** the story suite's axe run happens on first render
and a closed accordion has no panel in the DOM, so without a story that starts open the
accessibility check would pass by looking at nothing. Menu's `Open` records the same reasoning.
