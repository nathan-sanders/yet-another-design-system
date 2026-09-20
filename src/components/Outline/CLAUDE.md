# Outline

The headings on this page, with the one in view marked. A `<nav>` of same-page links indented by
heading level, a 1px track down the left edge, and a 2px indicator that slides to the active link
as the page scrolls. Not a Base UI component: nothing in Base UI is a list of anchors, and nothing
needed to be.

**Figma:** page `↪ Outline` `40005193:41753`. "Outline" `40005428:432` (`Size` Default/Small, an
`Items` slot), "Outline Item" `40005428:375` (`State` Default/Hover/Active/Focus × `Size`
Default/Small, a `Label Text` property and an `Indent` slot), "Outline Indent" `40005426:351`, all
under the Components section `40005426:350`. Docs frame `40005428:433`. The page was an empty
scaffold when the component was built, and the drawing was made from the code — the ProgressBar
order — on the same day.

**Reference:** Astryx `Outline` (astryx.atmeta.com/components/Outline), read at the DOM rather than
from its docs — WebFetch returns only the site navigation — for the geometry, the markup and the
props.

## API

```tsx
<Outline
  items={[
    { id: 'install', label: 'Installation' },
    { id: 'requirements', label: 'Requirements', level: 3 },
    { id: 'configure', label: 'Configuration' },
  ]}
/>
```

`items` is Astryx's `OutlineItem` — `id`, `label`, `level` — with `level` optional and defaulting to
2, a page's sections. `size` is `default` (32px rows at `text-base`) or `small` (24 at `text-sm`),
Tabs' two sizes. The controlled pair is
`activeId` / `defaultActiveId` / `onActiveChange`, TreeList's idiom. `scrollContainerRef`, `offset`,
`scrollOnClick`, `onNavigateStart` and `onNavigateEnd` are Astryx's, renamed where the house says so
(`hasScrollOnClick` → `scrollOnClick`, `onActiveIdChange` → `onActiveChange`). The landmark's name
is `aria-label`, default `"Table of contents"`, not a `label` prop.

`useOutlineFromDOM(containerRef, { levels })` is the sibling export: the `items` read off the
headings inside a container, kept current by a `MutationObserver`. Only headings with an `id` are
listed, because a heading nothing can link to has no place in an outline.

**What was dropped from Astryx.** `density` — it is `size`, the house name, and the two heights are
Tabs' 32 and 24 rather than Astryx's 36 and 28. (Shipped first as NavItem's 40 and TreeList's 32;
Nathan moved it to Tabs' scale the same day, with Tabs' 4px between the mark and what it marks.) `label` — a landmark is named with
`aria-label` here, like Breadcrumbs and TreeList. `xstyle`. `useOutlineFromMarkdown`, which is a
markdown pipeline's job and not a component's.

## One Tab stop, arrows between the headings

Tabs' keyboard pattern, which is also Astryx's: `tabindex="0"` on one link and `-1` on every
other, ↓/↑ to move focus with wrap, Home/End to the ends, Enter or Space to follow the link. The
tab stop roves — Shift+Tab out and Tab back returns to the link you left — and resets to the
active heading whenever the spy moves it, so Tab lands on "where you are" (the first heading when
nothing is active yet).

**This is the second decision on the question, and it reversed the first.** The component
shipped in #201 on the Nav record's rule — a set of links is a `<nav>` of anchors, every link its
own Tab stop, no roving — with Breadcrumbs and SideNav as the precedent. Nathan asked for Tabs'
pattern the same day: an outline sits beside a tab strip on the same scale and should walk the
same way, and a long table of contents is a lot of Tab presses to get past. The Nav rule stands
for Breadcrumbs and SideNav; this record is the exception to it, and says so.

**Arrows move focus and do not activate.** Tabs activates on arrow because switching a panel is
cheap and reversible in one keypress. Here activation scrolls the page, pushes the hash and fires
`onNavigateStart`, so activating on every arrow press would drag the reader through the document
while they were only looking at the list. Astryx draws the same line ("arrow keys move between
headings … Enter/Space activate"), and the Keyboard story asserts `onActiveChange` is silent
through a walk of the list.

The roving is on `tabindex` alone — no `role="tablist"`, no `aria-selected`. It is still a
navigation landmark of anchors with `aria-current="location"` on the active one, which is what a
screen reader should hear; a roving tabindex is a focus-management pattern, not a role. Space is
handled by hand because an anchor does not follow itself on Space (Enter it does natively, and
that goes through the click handler like a pointer click). The key handler is one `onKeyDown` on
the `<ul>` reading `document.activeElement`, rather than a handler per link — the list knows the
order, the link does not.

The link is a plain `<a>` rather than `useRender`: a same-page hash never goes through a router, so
there is no element to swap it for. A modified click (⌘, Ctrl, Shift, Alt, or a non-primary button)
is left to the browser — the reader asked for a new tab, and gets one. The track and the indicator
are `aria-hidden` spans — not `Divider`, for Tabs' reason: a `role="separator"` inside the nav is a
child the list did not ask for.

## The indicator slides, and it costs no JavaScript animation

Tabs' idiom turned on its side. A layout effect reads the active link's `offsetTop` and
`offsetHeight` and hands them to CSS as `--outline-indicator-top` and `--outline-indicator-height`;
one element transitions `translate` and `height` at `duration-fast ease-standard`, the 175ms Astryx
moves its own indicator at. Tailwind v4 compiles `translate-y-*` to the `translate` property, so
that is the property named in `transition-[…]` — the same footnote Tabs carries.

One positioning fact makes the measurement cheap: the track and the list share a `relative`
block wrapper. A link's `offsetTop` is measured against that wrapper, the track is `inset-y-0`
of it, and the indicator is `top-0` of the track — so the number needs no translation. A
`ResizeObserver` on the list re-measures when a label wraps.

**The track hangs off the wrapper, not the nav — found by the Sizes story.** It started as a
`self-stretch` flex sibling of the list, which is stretched to the *nav's* height, and a nav is
whatever its parent makes it: in a flex row beside the taller default outline, the small one was
stretched to match and its line ran on past the last item. A block wrapper is only ever as tall as
the list inside it, so the line ends where the list does whatever happens to the nav. The Sizes
story keeps its row stretched on purpose and asserts the small track's height equals its list's.

Nothing active — an `activeId` that matches no item, or headings that are not on the page yet —
hides the indicator rather than parking it at the top. `hidden` is a variant so the token guard and
the stories can both see it.

**No invisible semibold twin.** Tabs renders its label twice because a tab hugs its text and the
active one going to 600 would push its neighbours sideways. An outline link is `w-full` in a
column: the weight changes nothing's size, so there is nothing to dodge.

## Scroll-spy: a scroll listener, not an `IntersectionObserver`

`offset` defines an activation *line* — the top edge of the scroll root plus the height of whatever
overlays it — and the active heading is **the last one whose top has reached the line**
(`pickActive` in `scrollspy.ts`, tested in Node). Intersection thresholds cannot express a line
precisely; Carousel uses an observer because it asks a different question, "which slide is most
visible". Scroll events are coalesced with `requestAnimationFrame`, so a frame measures at most
once, and each measure reads every heading's `getBoundingClientRect` — cheap for a page's worth of
headings, and the only measurement that is right when a heading's ancestors have transforms.

Three rules on top of the line, each found by watching the mark be wrong:

- **One pixel of slack.** A smooth scroll that lands "exactly" on a heading settles a fraction of a
  pixel short in every browser measured, and without the slack the section *before* the one just
  clicked would win at the moment of arrival.
- **At the end of the scroll, the last heading is active.** The last section is usually shorter
  than the viewport, so its heading can never reach the line, and without this it could never be
  marked — clicking it scrolled to the bottom and marked the section above. Found on the InContext
  story. A root that does not scroll at all is never "at the end"; the rule would otherwise mark
  the last heading by default.
- **A click owns the scroll until it ends, and then the clicked heading is preferred.** While a
  navigation is in flight the spy ignores scroll events, or every section the smooth scroll passes
  would flash active on the way down. When it ends, one measure runs — landed, clamped or
  interrupted — and if the clicked heading is on screen below the line it keeps the mark. That is
  the case of a heading near the end of the content that the scroll had to stop short of: the
  end-of-scroll rule would say the *last* heading, and the reader clicked *this* one.

Headings that are not on the page are left out of the measurement, not given a fake position — an
absent heading in the middle of the list must neither block the ones after it nor count as reached.

**`offset` and `scroll-margin-top` compose.** A click scrolls the root itself — `scrollBy` on the
container or the window, not `scrollIntoView`, which walks up and scrolls every scrollable ancestor
(Carousel's finding) — to put the heading `offset` plus its own `scroll-margin-top` below the root's
top edge. The activation line reads the same margin off each heading, so **a heading is active
exactly where clicking it lands.** Leave `offset` at 0 when nothing overlays the content and let
`scroll-margin-top` do the work; set it to the header's height when one does.

The hash is pushed with `history.pushState`, never by letting the browser follow the anchor: the
browser's own jump ignores `offset` and lands the heading under the header. `pushState` rather than
`replaceState`, so Back returns to where the reader was.

**`onNavigateEnd` fires exactly once per `onNavigateStart`, and does not mean "arrived".** It fires
on the root's `scrollend` where the browser has it, otherwise when scroll events go quiet for 120ms,
and after 400ms of silence in either case — the fallback for a scroll the browser clamps to nothing,
which fires no events at all. Interrupting the scroll ends it too. So a "navigating" state built on
the pair can never leak, and a "flash the heading on arrival" effect will sometimes flash a heading
the reader scrolled away from. Astryx documents the same.

Reduced motion turns the smooth scroll into a jump, **chosen in JavaScript**: a scripted `scrollBy`
with `behavior: 'smooth'` ignores `scroll-behavior` CSS, so `motion-reduce:scroll-auto` would not
have reached it. The rule in the root CLAUDE.md is met by reading the media query instead.

**Controlled turns the spy off.** Providing `activeId` means the caller's scroll logic owns the
mark, so the built-in one steps aside entirely — Astryx's contract, kept. A click still reports
through `onActiveChange`.

## The scroll root

`scrollContainerRef` when given; otherwise the nearest ancestor of the first heading with
`overflow-y: auto | scroll` and more content than height; otherwise the window. `html` and `body`
are skipped in that walk — their scrolling is the window's, and `window.scrollBy` is the call that
moves it. Resolved fresh each time it is needed rather than cached, because the story that renders
the content after the outline is the ordinary one.

## Measured

Against Astryx's rendered DOM and again in the Browser pane on the `Sizes` and `DeepNesting`
stories, 240 wide, in both themes:

| | Astryx | Figma | Rendered |
|---|---|---|---|
| row height, default | 36 (20px line + 8/8) | 32 | 32 (`py-1` round `text-base`'s 24px line) |
| row height, small | 28 (`density="compact"`) | 24 | 24 (`py-0.5` round `text-sm`'s 20px line) |
| link padding | 8 / 8 / 8 / 12, radius 10 | 8 / 8 / 8 / 12, `rounded-md` | same, radius 8 |
| indent, level 1 / 2 / 3 / 4 | 12 / 12 / 28 / 44 | 12 / 12 / 28 / 44 (`Outline Indent` ×n) | `pl-3` / `pl-3` / `pl-7` / `pl-11` |
| list gap | 2 | 2 | `gap-0.5` |
| track | 2 wide, `rgba(0,0,0,.08)`, pill | 1, `Surface/Border`, `rounded-full` | 1, `bg-surface-border` — Tabs' `h-px` rule |
| indicator | 2 × row, black, `top`/`height` 95ms | 2 × row, `Surface/Border Emphasized`, x = −5 | 2 × row, `translate`/`height` 175ms — over the track and 1px into the gap, Tabs' overlap |
| track → list | 2 | 4 (`spacing/1`) | `gap-1` — Tabs' 4px from a tab to its rule |
| link, rest | `rgb(71,71,71)`, 400 | `Content/Subtle`, `font-weight/normal` | `text-content-subtle font-normal` |
| link, hover | `--color-overlay-hover`, `--color-text-primary` | `Surface/Overlay Subtle`, `Content/Primary` | `hover:bg-surface-overlay-subtle hover:text-content-primary` |
| link, active | black, 600 | `Content/Emphasized`, `font-weight/semibold` | `text-content-emphasized font-semibold` |
| type | 14 / 20 at both densities | `text/base` 14 / 24, `text/sm` 12 / 20 | `text-base`, `text-sm` |

The row heights differ from Astryx's on purpose: 32 and 24 are Tabs' `min-h-8` and `min-h-6`, at
the type each Tabs size uses, and the 4px between the track and the list is the 4px between a tab
and its rule, and the 1px track under a 2px indicator is the rule under the underline — so an
outline beside a tab strip is on one scale. Astryx's colors are its own neutral; the rendered ones are
`oklch(0.444 …)` at rest and `oklch(0.147 …)` active in light, `oklch(0.709 …)` and white in dark —
the tokens, resolved.

## The Figma drawing

Tree List's shape, because it is the nearest thing in the file: an item set, a list set with a
slot, and a spacer component for the one axis Figma cannot hold as a number.

- **Indent is a slot of spacers, not a variant.** A level-3 heading is one `Outline Indent` (16px,
  `width/w-4`) dropped in the item's `Indent` slot, a level-4 heading two — `Tree Rail`'s
  mechanism. A `Level` axis would have taken the set from 8 variants to 40.
- **The indicator lives in the Active item, not the list.** It is an absolute 2px rectangle at
  x = −5, `Surface/Border Emphasized`, stretched to the row, so it paints over the list's track
  (1px `Surface/Border`, then `spacing/1` of gap, then the items) wherever the Active item sits.
  The list never has to know which row is active.
- The rows are `spacing/1` / `spacing/0-5` above and below a label cloned from `Tree List Item`'s
  (Small rebinds it to `text/sm`) —
  which is how it carries `text/base`, `font/font-sans` and the weight binding without rebinding a
  font family (see the font-binding trap in memory). Active rebinds the weight to
  `font-weight/semibold` and the fill to `Content/Emphasized`; Hover and Focus take
  `Surface/Overlay Subtle` and `Content/Primary`; Focus adds the `Focus Ring` instance.

Three things the build had to learn about the canvas:

- **`resize()` resets a hug.** The item was made `counterAxisSizingMode: 'AUTO'` and then
  `resize(236, 40)`, which quietly pinned the height, so every Small variant stayed 40 with less
  padding on it until the hug was set again. The height was read back each step; the number is the
  only thing that caught it.
- **A new `SLOT` is 100 × 24 until it is resized**, whatever sizing it reports — `HUG` on a slot
  that has no children still measures 100 wide, and the label sat at x = 112. `resize(0.001, 24)`
  and then `HUG` again gives Tree List's 0.001. And a `FILL`-height slot inside a hug-height row is
  a cycle: the slot fills the stale row, the row hugs the slot. Hug the slot, let the row settle,
  then give the slot its fill back.
- **`Focus Ring` needs its own `clipsContent: true`.** The item frames have clipping off so the
  indicator and the ring's outer stroke can paint outside them; turning it off on the ring
  instance as well made the ring vanish from every render, though `absoluteRenderBounds` still
  reported it. Leave the instance as Tree List has it.

## Traps

- **A hidden tab never finishes a smooth scroll.** `document.hidden` stops the scroll animation
  the way it stops every other animation, so a probe from the hidden Browser pane sees the click
  update the hash, the 400ms fallback end the navigation, and the mark stay put. The visible
  Chromium of `npm test` is where the click path is proved; the `ScrollSpy` story asserts the
  container landed within 2px and `onNavigateEnd` fired once.
- **`'onscrollend' in window` is a TypeScript narrowing.** After the check, `window` is `never`
  and `window.setTimeout` fails to type. Read it once into a boolean.
- **A story's scroll box needs `tabIndex={0}`, a role and a name**, or axe fails it on
  `scrollable-region-focusable` — the same rule the Foundations tables and `Table` carry.
- **A story's decorators nest inside the meta's.** The 240px frame is a per-story decorator, or
  `Sizes` and `InContext` would have been boxed into it.

## Stories

`Playground` (the mark, the indicator's geometry, a click), `Sizes` (32 and 24, indicator follows,
4px off the track),
`DeepNesting` (12/12/28/44, indicator on the track not the indent), `Controlled` (spy off, click
reports once), `Keyboard` (one Tab stop on the active heading, arrows with wrap, Home/End, the stop
roves, Space and Enter activate and arrows do not), `ScrollSpy` (a box that scrolls: the
mark follows, the end-of-scroll rule, a click lands and `onNavigateEnd` fires once), `InContext`
(an article with `useOutlineFromDOM` and a sticky outline on the window).

## Best practices

Mirrored from the **Best practices** block on `↪ Outline` (`40005428:446`) in Figma. The two are
one text in two places — change one and change the other.

**Do**

- Pass a flat, ordered list of headings and let level set the indent. The outline is not a tree; it is the page, top to bottom.
- Give every heading a stable id. The outline links to it, and the scroll-spy reads it.
- Use activeId when your own scroll logic owns the section — a virtualized document, a stepper. The built-in spy steps aside.
- Pass scrollContainerRef when the content scrolls in a panel, drawer or split pane rather than the viewport.
- Set offset to the height of a fixed header, so a heading activates exactly where clicking it lands.

**Don't**

- Do not use it for app routes. That is Side Navigation or Top Navigation — a different page, not a different place on this one.
- Do not use it for a hierarchy people fold. That is Tree List.
- Do not nest past four levels. Each one costs 16px, and at 240 wide the labels run out of room.
- Do not treat onNavigateEnd as "arrived". It also fires when the reader interrupts the scroll.
- Do not put two on a page without distinct names. Two landmarks called "Table of contents" are one landmark to a screen reader.
