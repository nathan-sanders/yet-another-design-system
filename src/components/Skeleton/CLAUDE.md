# Skeleton

A pulsing placeholder the shape of content that is still loading. Mirrors two Figma sets on
`↪ Skeleton` (`40005222:44240`): **`Skeleton`** (`40005222:44292`), whose `Appearance`
default | subtle and `Inverse` true | false are the two props and whose four variants are the four
combinations; and **`Skeleton - Text`** (`40005222:44301`), whose `Size` sm | base | lg | xl is
the one prop on `Skeleton.Text`. Asked for with the node in hand, with Meta's Astryx `Skeleton` and
shadcn's as the references; `Table`'s record had already parked the need ("inventing a shimmer
inside `Table` puts a new visual primitive in the wrong place"), so both halves of the roadmap bar
were met.
**No Base UI primitive underneath** — the second component after Calendar without one. A skeleton
is a `<div>` with `aria-hidden`, and the ARIA story belongs to the *region*: `aria-busy` on the
container and a visually hidden "Loading…", which the `InContext` story shows.
**Color is the Figma binding read literally.** The file draws a `Content/Primary` fill
(`Content/Inverse` when inverse) with the *node's* opacity at 20 / 10% — 30 / 20% inverse — so
the code paints `bg-content-primary/20`, `/10`, `bg-content-inverse/30`, `/20`. Not `opacity-20`
on the element: the pulse animates `opacity`, and the two would fight. (`subtle` upright happens
to equal `surface-overlay-subtle` exactly; the modifier form keeps the four cells one idea.)
**The pulse is shadcn's speed on a token.** shadcn is a literal 2s opacity pulse, 1 → 0.5 → 1,
and Nathan preferred it to Astryx's stepped 0.4s flicker. `skeleton-pulse` in `generate.py` runs
1 → 0.5 over `duration-slow` (975ms) with `infinite alternate`, so a full breath is 1950ms —
shadcn to within 2.5%, with no literal duration anywhere. `ease-in-out` is a CSS keyword like the
`linear` on `progress-indeterminate`: a breath slows at both ends, and `--ease-standard` slows at
one. Not Tailwind's own `animate-pulse`, whose 2s and bezier Figma cannot reach.
`motion-reduce:animate-none` is ProgressBar's idiom: the global rule clamps to 1ms and one
iteration, which would leave a placeholder frozen wherever that iteration ended.
**The easing of a CSS animation lives on its keyframes**, not on the effect: `getAnimations()[0]
.effect.getTiming().easing` reads `linear` whatever the stylesheet says, and the `Playground`
play function asserts `getKeyframes()[0].easing` instead. Found by the test failing.
**Size and shape are `className`**, as in shadcn: `size-9 rounded-full` is an avatar, and `cn`
lets the caller's radius beat the recipe's `rounded-xs`. Neither is a Figma property (the set is
drawn at 160×24 with no size axis), and Astryx's `width` / `height` / `radius` props are left
out for the reason Card's `padding` is not a Figma variant — a prop per dimension is a second
spelling of a utility class. Astryx's `index` stagger is left out too: one shared breath reads as
a page loading, a wave reads as separate things.
**`Skeleton.Text` exists because a line is taller than its letters.** Each size is a box the
height of the text size's *line-height* (20 / 24 / 28 / 32, `h-5` … `h-8`) with a bar the height
of its *font-size* (12 / 14 / 16 / 18, `h-3` … `h-4.5`), so a stack of them takes exactly the
space the paragraph will. A bare `<Skeleton className="h-3.5" />` is the right bar and the wrong
row, and lands 10px short per line. `base` is the default because `text-base` is the body size;
the file lists `sm` first, which is the scale's order, not a preference. Only `Appearance=Default`
is drawn for the text set; `appearance` and `inverse` pass through anyway, because the fills exist.
**A percentage width needs a parent with a width.** `Table.Cell` wraps its content in a flex item
that hugs, so a `w-4/5` skeleton in a cell measures 0px and the cell looks empty — found in the
`InContext` story, which now says `w-28` in the table and `w-2/5` in the card, and explains why.
**Figma's page was a scaffold**, like ProgressBar's: "Description goes here.", blank Preview
frames and one "Usage rule." per column. The description, a Preview in both themes (the
`InContext` card's shape, the four text sizes, a default and a subtle block — instances of the
two sets, the avatar a `rounded-full` token rebind on a 36×36 instance) and the guidance below
all went code → file in the same sitting.

## Best practices

Mirrored from the **Best practices** block on `↪ Skeleton` (`40005222:44240`) in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Match the size and shape of the content it stands in for — a circle for an avatar, one `Skeleton.Text` per line at that line's size — so nothing jumps when the content lands.
- Vary the widths of text lines. Real lines are not all the same length, and a stack of identical bars reads as a pattern rather than as text.
- Mark the loading region as busy (`aria-busy`) with a visually hidden "Loading…". The skeletons themselves are hidden from assistive technology; the region does the announcing.
- Replace the skeleton with the content when it arrives. Swap, never overlay.

**Don't**

- Do not use one when the content's dimensions are unknown. A `ProgressBar` with `value={null}` is the loading indicator for that.
- Do not combine it with a progress indicator on the same content area. Pick one loading pattern.
- Do not show skeletons indefinitely. If loading fails or drags on, show an error or an empty state instead.
- Do not use `inverse` on a plain surface. It is the white fill for an emphasized background, and on the canvas it disappears.
