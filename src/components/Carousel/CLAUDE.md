# Carousel

Steps through a set of items one screen at a time, with pagination for moving between
them. Mirrors Figma's `Carousel` (`40004591:43045`) on `↪ Carousel (In Progress)`, plus
`Carousel - Pagination` (`40004379:66099`) and `Carousel Pagination Button`
(`40004379:66086`) from the pagination page. Flat-prop API, not compound:
`<Carousel aria-label="…" hasPagination hasSnap hasLoop layout="fill" gap={2} handleRef={…}>{items}</Carousel>`.
The dot row and the dot are **internal**, not exports — Figma models them separately
because a canvas has to draw a dot somewhere, and nothing outside a carousel has a use
for a 24px dot that grows into a pill.

**It needed no animation library, and that is the headline.** The root record has listed
Carousel since the motion tokens landed as "the one plausible candidate left on the
roadmap" — the last thing that might want FLIP, drag or springs. It does not. Astryx's own
carousel was read at the DOM rather than from its docs, and the scroll container is
`overflow-x: auto` with `scroll-behavior: smooth` and nothing else: the browser owns the
easing, the momentum and the snap. **Second time this answer has come back the same shape**
— `Tabs` was the other candidate and `Tabs.Indicator` already published the geometry — so
"check whether the platform does it before assuming it needs JavaScript" now has two cases
behind it and the dependency list is unchanged.

**Figma and Astryx describe two different components under one name, and each wins half.**
Astryx's is a continuous strip: several items visible, buttons floating over the track on an
anchor layer, gradient edge fades, no dots. Figma's is a gallery: one full-width item per
view, dots and arrows in a row *below* the track, no fade. **Figma decides what it looks
like; Astryx decides how it works** — so the layout, the dots and the button placement are
Figma's, and the scroll engine and the entire ARIA contract are Astryx's, copied from their
rendered output rather than paraphrased. `hasEdgeFade` is not ported: the dots and arrows
already say there is more, and a gradient over a full-bleed image is ink that means nothing.

**The second component in the library with no Base UI primitive underneath it**, after
`Calendar`. Nothing was added to `vite.config.ts`'s `optimizeDeps.include`, because that
list only exists for new `@base-ui/react/*` subpaths.

**Active slide is an `IntersectionObserver`, not scroll arithmetic.** The slide can change
six ways — an arrow, a dot, a trackpad swipe, shift+wheel, the arrow keys on the focused
container, and a snap settling after a flick — and only one of those is a scroll position
this component chose. Measuring what is on screen answers all six with the same code and
never has to re-derive the snap points. Both halves were verified in real Chromium: an
`ArrowRight` on the focused track moved `scrollLeft` 816 → 1224 and the dots followed, and
setting `scrollLeft = 0` from outside the component moved the marked dot back to 1 and
disabled the previous arrow. The threshold list is `[0, .25, .5, .75, 1]` and is load-bearing
— with a single threshold the callback fires only at the boundary, and a half-scrolled
carousel reports whichever slide crossed it last. Ties resolve by walking the DOM, not the
entry list, so two equally visible slides always pick the earlier.

**`motion-reduce:scroll-auto` is required, not belt-and-braces.** Section 5 of `theme.css`
honours `prefers-reduced-motion` globally by clamping `animation-duration` and
`transition-duration` to 1ms, and `scroll-behavior` is neither of those. It is **the one
piece of motion in this library the global rule cannot reach**, so the component turns it
off itself. Measured under Playwright's `reducedMotion: 'reduce'`: `scroll-behavior` reads
`auto`.

**Figma's `overflow-clip` is ported, for the first time.** The root record counts eleven
components that dropped it deliberately, because the focus ring paints outside the component
and clipping would slice it off. Here the clip *is* the component — a carousel with no
overflow is a row. The cost is real and is paid with `py-1`: CSS will not let `overflow-x:
auto` sit beside `overflow-y: visible` (the used value becomes `auto` on both axes,
confirmed by reading the computed style), so a focus ring inside a slide would be clipped
top and bottom. The ring reaches 4px, which is exactly `py-1`, so the padding buys it back.

**`layout` is a prop because it cannot be derived, and it shipped wrong once.** The first cut
wrapped every child in `w-full`, which is right for Figma's gallery and silently wrong for
everything else: the `MultipleVisible` story put five 200px cards into five 400px slides and showed
exactly one at a time, while this record claimed children with their own width "give a continuous
strip". Nathan caught it. The obvious fix — let the wrapper size to its content — is worse, because
the common case is an `AspectRatio` child, and `AspectRatio` is `w-full`: a content-sized wrapper
round a `w-full` child resolves circularly and collapses to nothing, which that component's own
record already warns about. **CSS has no way to say "full width unless the child asked for one",** so
the caller says, and the words are `hug` / `fill` — the pair `Tabs` and `SegmentedControl` already
use for the same question.

Worth reading against the root record's derive-don't-declare rule, which it refines. That rule says
derive what the element already knows and declare what only its ancestors know. This is a third
case: **a wrapper cannot read its child's intent about its own size**, because asking produces a
circular layout rather than an answer. The story now asserts the geometry — five slides, 200px each,
the second starting at 212px inside a 400px track — since a strip and a gallery of one look similar
enough at a glance that only the numbers separate them.

**`scrollTo` on the container, never `scrollIntoView` on the item.** `scrollIntoView` walks
up and scrolls *every* ancestor that can scroll, so a carousel inside a scrolling page drags
the whole page sideways and usually vertically too. The container form moves one element.

**The dot's box grows, not just its mark.** Figma draws the growth on the indicator —
12×12 circle to 24×12 pill — but the hit box has to grow with it (24×24 to 36×24, Figma's
`width/w-6` and `width/w-9`) or the pill would overflow a 24px button. The border is on
every state including the selected one, where it sits on the same token as the fill and is
invisible: it contributes nothing but a stable size, which is what stops the mark jumping
2px as it is selected. All eight numbers were read back off computed styles, not a
screenshot.

**Hover is scoped to the *unselected* dot**, via `group-hover` on the mark rather than a
rule on the button. Figma draws no hover for `Selected=True`, and painting one would move
the current slide off its own token. Verified by hovering dot 2 with a real pointer and
reading dot 1 as well — the selected mark did not move.

**`aria-current="true"`, not `aria-selected`.** These are buttons, not tabs: `aria-selected`
is only meaningful inside a `tablist`, and a `tablist` here would fight the scroll container
for the same arrow keys.

**`aria-label` is required rather than defaulted.** Astryx falls back to the string
`'Carousel'`, and a region announced as "Carousel, carousel" tells a screen-reader user
nothing they could not guess. `Popover`'s `label` is the precedent for requiring it.

**There is no key handler at all.** The scroll container carries `tabIndex={0}` — Astryx's
shape and the APG's — and the browser's native arrow-key panning does the rest. It is also
what satisfies axe's `scrollable-region-focusable`: a region you can only pan by dragging is
unreachable from a keyboard.

**A story placeholder on `background-subtle` paints nothing.** The first `Slide` used it and
the screenshot came back with four dots and no slides: `--surface-background-subtle` and
`--surface-canvas` resolve to the same value, in light mode as well as dark. It is
`background-primary` with a border now.

## What was left out

- **Auto-advance.** One of Astryx's own "don't"s, the reason the APG pattern carries a pause
  button, and it takes the timing away from the reader. There is no `autoplay` prop and
  there should not be one.
- **`hasEdgeFade`**, `padding`, `xstyle`, `style` — the first because Figma draws no fade,
  the last two because StyleX is not the styling system here.
- **Overlay button placement.** Astryx anchors its buttons over the track; Figma puts them
  below-right, and Figma owns the layout.
- **Vertical orientation.** Neither source draws one, so it is absent from the props rather
  than left to break quietly — the same call `Tabs` made about `orientation`.

## Best practices

**No Figma block to mirror.** The Best practices panel on `↪ Carousel (In Progress)`
(`40004617:43173`) is still the template's "Usage rule." on both sides, which is its normal
unfilled state rather than evidence nobody has thought about it. These are written here,
adapted from Astryx's, **each one checked against this API** — the Avatar lesson, where two
rules came across naming props this library does not have. The file owes a block, and this
is the text to put in it.

**Do**

- Use a carousel when the content is browsable rather than essential. Everything past the
  first item is hidden until somebody moves, and not everybody will.
- Give it an `aria-label` that says what is inside — "Featured products", "Team members" —
  not what it is. The types require one for that reason.
- Pick the shape with `layout`. `fill` (the default) is Figma's one-per-view gallery; `hug` is a
  continuous strip of cards that brought their own width. Same component either way.
- Reach for `hasLoop` on a small, cyclable set like a photo gallery, where coming back round
  feels natural.
- Keep the item width and the gap consistent, so the track reads as a decision rather than
  as content overflowing by accident.

**Don't**

- Do not put anything every reader must see behind it. Critical content goes above the fold,
  not one slide to the right.
- Do not advance it on a timer. There is no prop for it, and adding one would take the pace
  away from the person reading.
- Do not nest one inside another. Two scroll containers fighting for the same arrow keys is
  not navigable from a keyboard.
- Do not turn `hasPagination` off unless something else on the page is doing the pointing.
  A track with no affordance is the carousel people complain about.
