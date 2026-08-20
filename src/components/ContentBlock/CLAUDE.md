# ContentBlock

A bordered card that owns one titled region of a page — the part a bento layout is made of.
Mirrors Figma node `40004181:4493` (the set, whose only axis is `Floating` false | true) and its
private header `40004181:4365` (`_Content Block Header`), whose Icon / Header Slot / Actions
booleans become slots here.

**Not a Base UI component.** There is no headless card primitive, so this is a native `<div>`, like
Badge and Banner. Base UI count stands where it was.

**Compound, not a flat prop list.** Banner takes `title` / `children` / `action` because a banner is
always the same shape. A block is not: it may have no header at all, its body is arbitrary, and
content that should reach the borders — a chart, a table — has to be able to skip the padded body
entirely. `ContentBlock.Header` + `ContentBlock.Content` gives all three without a `padded={false}`
prop, which is most of the reason for the shape. See the `FullBleedContent` story.

**It is a `<div>`, not a `<section>`.** A named `<section>` is a landmark, and a bento view holds up
to nine of these; nine landmarks is noise in a rotor, where nine headings is an outline. The
header's real heading is what makes the layout navigable.

**`headingLevel` is Accordion's prop, for Accordion's reason** — only the page knows what depth its
blocks sit at, and guessing is an axe `heading-order` failure rather than a matter of taste. The
map differs though: Accordion stores elements (`<h3 />`) because Base UI's Header takes a `render`
prop, and this stores tag names (`'h3'`), because a plain `<div>` wants a component reference.
Either way it is an explicit map — `` `h${level}` `` widens to `string`, which is not a JSX tag.

**A context carries `headingLevel` *and* `emphasis`.** The second is not decoration: the title needs
Content/Emphasized on a card and the root's own foreground on the accent, and the header cannot see
from below which surface the root chose.

## The emphasis axis

Figma draws `default` only. `subtle` and `accent` are code-first — the Accordion route, which this
library allows so long as the file catches up.

- **`accent` is the anchor cell.** It uses the Action/Primary pair because that is the only ramp in
  the theme with a foreground already tuned for contrast on its background in both themes, so there
  is no `dark:` class here — Banner's finding, reached the same way.
- **A ghost Button on the accent is invisible.** Action/Ghost's foreground is the same stone as the
  accent's background. Use `appearance="overlay"` in `actions`, which is what Banner does for its
  four feedback backgrounds. The `ActionsOnAccent` story shows both, side by side, so the failure is
  on the record rather than in a sentence.
- **`subtle` is the canvas colour in both themes** — `--surface-card-subtle` and `--surface-canvas`
  are the same stone. On a canvas it therefore reads as an *outline*, not as a second fill, and that
  is the de-emphasis: filled → outlined → accent. Inside another card it reads as a recessed well
  instead. Worth knowing before reaching for it on a white background, where it is the only one of
  the three that changes nothing.

## Details that were settled once

- **`first:pt-4` on Content.** Figma sets the body's top padding to 0 because the header's 8px
  already sits above it. A block with no header has to put the 16 back, and the body knows it is
  first from its position rather than from a `hasHeader` prop the caller could contradict. No
  JavaScript, and measured: 0/16/16/16 with a header, 16/16/16/16 without.
- **Actions take the default Button size, not `small`.** The row is `min-h-12` with 8px of padding
  above and below, so it has exactly 32px of room — which is what a default Button is. They were
  `small` when this first landed, on an assumed constraint that turned out not to exist. The
  library's rule is that default comes first and a smaller size needs a measured reason.
- **The header's padding is asymmetric on purpose** — `pl-4 pr-2`, straight from Figma. The 8 on the
  right is there because a 32px ghost Button carries its own 12px, so an icon-only action lands 16px
  off the edge like everything else. A header with no actions does sit 8px short on the right; that
  is the file's drawing, not an oversight.
- **`min-h-12`, not `h-12`.** A title that wraps grows the row instead of spilling — the
  `LongTitle` story. Measured at exactly 48px in the ordinary case.
- **`h-full` on the root** so tiles in one `BentoGrid` row end level whatever each holds. In
  ordinary flow a percentage height against an indefinite parent resolves to auto, so it costs
  nothing outside a grid.
- **`titleSlot`, not `slot`.** `slot` is a real DOM attribute (Shadow DOM assignment) typed
  `string` — the **third** time this library has hit that collision, after Divider's `style` and
  Banner's `title`. Both earlier ones had to choose between `Omit`ing the attribute and renaming the
  prop; here renaming is free, because `Tabs.Tab` already calls its version `endSlot` and a
  qualified slot name is the house spelling. This one says which end it is on.
- **No focus ring on the block.** It is not focusable, and `focusRingWithin` is the wrong tool: a
  container that rings identically wherever focus lands inside it says nothing, which is the rule
  `src/lib/focus.ts` and Combobox's tokenizer both record. Interactivity lives in `actions`.
- **Figma's `overflow-clip` is not ported** — the tenth time. A focus ring paints outside the
  control it belongs to, so a Button on the first line of a clipped block loses the top of its ring.
  Verified `overflow: visible`.

## Measurements to check if this changes

Header 48px tall, padding 8/8/8/16. Body 0/16/16/16 with a header and 16/16/16/16 without. Radius
12px, border 1px. `shadow-low` (0 2px 4px) present only when `floating`. Accent title white on
stone-800 in light and black on stone-100 in dark, with no `dark:` class anywhere in the file.

**Storybook trap, and it cost half an hour.** A Storybook left running from an earlier session
serves a stale Tailwind scan: classes new to the repo — here `pl-4`, `pb-2`, `min-h-12`,
`first:pt-4` — are simply absent from the stylesheet, so a correct component measures wrong in ways
that look like real bugs (a 32px header, a body with no top padding). A page reload does not fix it
and `npm run build` disagrees with what the browser shows. Restart the dev server before believing
any measurement of a brand-new component.
