# Card / ClickableCard

The plain container, and the one that is a hit target. Mirrors two Figma sets under
`40004220:13049`: `Card` (`40004237:14594`, Emphasis default | subtle | accent × Floating false |
true) and `Clickable Card` (`40004251:16237`, Emphasis default | ghost × State default | hover |
focus | disabled). Anatomy in both is a single `Content` slot — no header, no footer, no compound
parts, because there are none in the file.

## Why this exists at all, and is not a headerless ContentBlock

The roadmap entry set the burden of proof: *"if nobody asks for it, it is a `ContentBlock` with no
`ContentBlock.Header`, and the roadmap entry should be closed rather than built."* Three things
answered it, and the first is geometry rather than opinion.

- **A card is `rounded-md` (8px) with 12px of padding; a block is `rounded-lg` (12px) with 16.**
  Read back from the file, not inferred. They are drawn to nest, and 8-inside-12 is the right way
  round — that is the `InsideContentBlock` story, kept so the two radii cannot quietly converge.
- **The compositions use both, differently.** `40004220:13045` is four plain Cards inside one
  ContentBlock as a KPI row, and three ContentBlock columns full of Clickable Cards as a kanban.
- **Sixteen story files had already hand-rolled it**, `Kbd.stories.tsx` with a literal
  `function Card()`, at `p-4`, `p-5` *and* `p-6`, some on `border` and some on `inset-ring`.
  `ContextMenu.tsx` documented `render={<Card />}` for a component that did not exist.

**Not a Base UI component.** There is no headless card primitive, so `Card` is a native `<div>` like
Badge, Banner and ContentBlock. `ClickableCard` is the thirteenth Base UI component and the second
that is a hook rather than a component — `useRender`, as `Link` is.

## Two components, not one with a flag

The library's rule is to derive a variant from a value that already says it, and `href`/`onClick`
does say "clickable". But the *emphasis axes do not overlap*: `accent` and `floating` exist only on
the static set, `ghost` only on the clickable one. One component would have to accept `accent`
together with `ghost`, which no variant in the file draws. So: two components in one folder sharing
`styles.ts`, which is Avatar/AvatarGroup's and Input/InputGroup's layout.

## The border tracks the fill unless the file says otherwise

The thing to notice about these variants, and the one real divergence from ContentBlock. Read back
per variant:

| Variant | fill | stroke |
|---|---|---|
| Card default | Surface/Card Primary | **Surface/Border** |
| Card subtle | Surface/Card Subtle | *Surface/Card Subtle* |
| Card accent | Surface/Card Emphasized | **Surface/Border Emphasized** |
| Clickable default rest | Surface/Card Primary | **Surface/Border** |
| Clickable ghost rest | Surface/Card Primary | *Surface/Card Primary* |
| Either, hover | Surface/Card Subtle | *Surface/Card Subtle* |

So a subtle card is a **fill**, not an outline — where `ContentBlock`'s `subtle` keeps
`border-surface-border` and *is* an outline. Same word, two components, drawn differently on
purpose: a block is a region of a page and wants an edge; a card is an object in a list and wants a
face.

**The consequence matters more than the rule.** `--surface-card-subtle` and `--surface-canvas` are
the same stone in both themes, so a subtle *card* on the canvas is invisible — where a subtle
*block* is at least an outline. It is for use inside another surface: a recessed well in a white
card, which is exactly where the KPI composition puts it. The `Emphasis` story shows it vanishing
on the canvas and `InsideContentBlock` shows it working, so the failure is on the record rather
than in a sentence.

**Ghost is the same trick doing a different job.** Its stroke is bound to `Surface/Card Primary` —
its own fill — rather than removed, so a ghost row is exactly the size of a bordered card beside it
and the hover is one colour move instead of a border appearing from nowhere. Written as the token
and not as `border-transparent` for both reasons. It disappears on a `surface-card-primary` parent
and is a white block on the canvas: check what is behind it.

## Details that were settled once

- **`flex-col gap-2`, where Figma's frame is a `HORIZONTAL` auto-layout with `itemSpacing: 0`.** The
  file models the card as one `Content` slot, so the frame has nothing to space — the 8px between a
  KPI card's title and its value lives *inside* the slot. In code there is no separate Content part
  to carry it, so the root does, at `ContentBlock.Content`'s value. Override with `className`.
- **The padding scale is code-first and `none` is the only step with a structural job.** Figma draws
  one padding, `spacing/3`. `none` exists because content that must reach the border — an image, a
  chart — is what `ContentBlock` solves by letting you omit `ContentBlock.Content`, and a
  single-slot card has no such seam. `tight`/`loose` settle the `p-4`/`p-5`/`p-6` drift the stories
  had. **Owed to Figma as a `Padding` property on both sets.**
- **No `h-full` on the root**, unlike ContentBlock. That is a bento tile's answer to ending level
  with its row; flex and grid children already stretch by default, which is what makes the KPI row
  even without it. Measured on that story.
- **No focus ring on `Card`** — it is not focusable, and a container that rings identically wherever
  focus lands inside it says nothing. ContentBlock's ruling, and `src/lib/focus.ts`'s.
- **`ClickableCard`'s ring is the shared one, imported not re-derived.** Figma draws the focus state
  as a separate `Focus Ring` instance — a 2px OUTSIDE white stroke with a 3px-spread shadow — and
  switches `clipsContent` off on those variants so it is not sliced. That is `focusRing` drawn on a
  canvas, and it is also the file independently reaching the conclusion this library reached ten
  components ago about `overflow-clip`. Do not port the geometry.
- **`overflow-clip` is not ported** — the eleventh time, and the first where the file half agrees.
- **The element follows the value.** `href` → `<a>`, otherwise `<button type="button">`, `render` →
  anything. `useRender`'s `defaultTagName`, which is Link's mechanism.
- **A disabled link is a `<span>`.** `<a>` has no `disabled` attribute and `pointer-events-none`
  alone leaves it tabbable. Link's answer, Breadcrumbs' before it. **`aria-disabled` on it is not
  decoration:** `opacity-40` puts the text below 4.5:1 and axe only exempts an inactive component by
  walking up from the text looking for a disabled control or `aria-disabled`.
- **`disabled` is a variant, not Button's `disabled:` modifier**, because only one of the two
  element paths can carry the native attribute.
- **`selected` is `aria-current`, not `aria-pressed`.** This is "the one you are viewing" — a
  navigation state. A card you switch on and off is a different component (Astryx's
  `SelectableCard`), and nothing in the file or the compositions asks for one. Drawn as the subtle
  fill *plus* the emphasized border, repeated under `hover:` so the pointer cannot wash the outline
  off the selected row — otherwise "selected" and "the pointer is here" are the same pixel.
  **Code-first: the file owes `Clickable Card` a `Selected` state.**
- **Link's motion, not Button's.** `transition-colors duration-fast-min ease-standard`; Button's
  bare `transition-colors` predates the motion tier and is not the model.
- **`text-left` and `cursor-pointer` are both said out loud**, because a `<button>` centres its text
  and Tailwind's preflight gives it `cursor: default`.

## When to reach for which

Astryx's test is a good one and worth keeping: *could you reorder or remove this independently?* If
yes it is a card — one metric, one message, one product in a grid. If no it is a region of a page,
and that is `ContentBlock` or nothing at all. Whitespace and a heading group content perfectly well,
and a library that makes cards cheap is a library that ends up with borders around everything.
Between the two card sets: a board is objects you move, so each wants its own edge (`default`); a
mail list is one list, so the rows should not (`ghost`).

## Measurements to check if this changes

Radius **8px**, border **1px**, padding **12px** at `default` (0/8/12/16 across the scale), **8px**
gap between children, 14/24 type, `overflow: visible`. `shadow-low` (0 2px 4px, 25% neutral-800)
present only when `floating`. Subtle and accent have border-colour **equal to** their background;
default and ghost do not. Focused ClickableCard is pixel-identical to unfocused — measured 375×82
both ways. Disabled is opacity `0.4` with `pointer-events: none`. Hover moves fill **and** border to
`surface-card-subtle`.

Contrast, measured across Stone / Olive / Mauve / Slate in both themes: the lowest pair is
`content-subtle` on `surface-card-subtle` at **6.26:1** (Olive light). Every pair clears AA.

**Storybook trap.** A server left running from an earlier session serves a stale Tailwind scan, so
classes new to the repo — here `p-3`, `border-surface-card-primary`,
`hover:border-surface-card-subtle` — are simply absent and a correct component measures wrong. A
reload does not fix it. Restart before believing any measurement.
