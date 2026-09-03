# AspectRatio

A box that holds a width-to-height ratio and clips what is put in it. Mirrors the Figma
component set **"Aspect Ratio"** (node `40004379:42735`), whose `Ratio` property — `Custom`,
`1:1`, `5:4`, `4:5`, `16:9`, `9:16` — is the `ratio` prop here. Its description reads "Image
with aspect ratio" and links to shadcn's AspectRatio; every variant draws the same thing, a
240px-wide clipped box around one `object-cover` image.

**It paints nothing, and that is the design.** No fill, no border, no radius —
`get_variable_defs` on the set returns `{}`, and the component binds no tokens for the same
reason. The background belongs to whatever is put inside it, or to a `className` from the
caller. This is the only component in the library with no semantic-token utility in it, and
`tokens.test.ts` correctly finds nothing to check.

## `ratio` takes a number, and the number is Figma's `Custom`

`Avatar`'s `size` does the same thing for the same reason: a scale of named steps plus an
escape hatch for the values the scale does not have. `2.35` is anamorphic film, `1.91` is a
link preview card; neither is a named step here or a variant there.

**The number does not become an inline style.** It travels as `--yads-ratio` and is read back
by the `aspect-(--yads-ratio)` utility, so the `aspect-ratio` declaration stays at class level
in both branches and a caller's `className="md:aspect-square"` can still override it. Emitting
`style={{ aspectRatio }}` would have outranked every utility and quietly made a custom-ratio
box impossible to change at a breakpoint. Astryx's AspectRatio calls this out too, and its
reasoning is the same.

**Ratio trap:** the five named ratios are a written-out map, not an interpolation. Tailwind
finds classes by scanning source text, so `` `aspect-[${w}/${h}]` `` generates no CSS at all,
and the failure is silent — the box lays out at its content height and reads as a broken
component. `BentoGrid`'s span maps and `src/lib/focus.ts` carry the same warning.
`aspect-5/4`, `aspect-4/5` and `aspect-9/16` are v4 bare fractions and were compiled against
this repo's Tailwind (4.3.3) to confirm they emit; `1/1` and `16/9` go through the older
`aspect-square` and `aspect-video`.

**Ellipse trap:** `rounded-[50%]`, never `rounded-full`. A 9999px radius on a non-square box
gives a *stadium* — two semicircles either side of a straight run — and only a percentage
radius bends with the box into a true ellipse. At `1/1` the two are indistinguishable, which
is exactly how this gets shipped wrong.

## What came from Astryx, and what Figma now says

`fit` and `shape` come from Meta's Astryx AspectRatio; Figma had only `Ratio`. **The set has
been extended to match** — `Ratio` (6) × `Fit` (3) × `Shape` (2) = 36 variants — so there is no
code-first debt here of the kind `BentoGrid` carries. Two things about how those variants are
drawn are worth knowing before touching them:

- **Ellipse is an `ELLIPSE` node, not a corner radius.** Figma's `cornerRadius` is absolute
  pixels, so the largest radius a 240×135 frame can take still draws a stadium. `Fit=Cover` and
  `Fit=Contain` put the image on the ellipse itself; `Fit=Center` needs the ellipse as a *mask*,
  because there the shape is the clip and not the content.
- **`Fit=Contain, Shape=Ellipse` looks broken and is correct.** What paints is the ellipse
  intersected with the letterboxed picture, which comes out as a squircle with flat sides. CSS
  does exactly the same thing: `object-fit: contain` leaves the bands transparent, and a box
  that paints nothing has nothing to show through them.
- **`Fit=Center, Shape=Ellipse` is indistinguishable from the rectangle** whenever the content
  is small enough to sit inside the oval — which, at natural size, it usually is. Also correct,
  and also worth not "fixing".

- **`fit` is optional on purpose.** Left off, the children are rendered as passed and style
  themselves — the shadcn behaviour the Figma description links to, and the right default for
  a chart or a video player that already fills its box. Set, an inner slot fills the box and
  stretches every direct child. Pass one child in that case; two are two overlapping layers,
  so an overlay or caption goes inside a single wrapper.
- **`fit="center"` is a flex centre, not an object-fit.** There is nothing to fit — the child
  keeps its natural size and the clip does the rest.
- **`shape="ellipse"` overlaps `Avatar` and does not replace it.** Avatar owns the initials
  fallback, the status dot and the group ring. This is the oval on a 16:9 and the circle that
  is not a person.

## What was left out

- **No radius prop.** `cn` merges, so `className="rounded-md"` reaches the box and wins. A
  `radius` prop would have been a second, worse way to spell a token utility.
- **No `render` / polymorphism.** `ClickableCard` and `Link` need it because they change
  element; a ratio box is a `div` wrapping a `figure`'s content, not the `figure` itself.
- **No role, no accessible name.** The child carries the whole description — an `alt`, or
  `alt=""` when the image is decorative.

## Sizing rules worth repeating

The width comes from the parent and the height is derived, so it needs an ancestor with a
definite width. In a shrink-to-fit parent — `inline-flex`, `w-fit`, a float — it contributes
no intrinsic width and collapses. Constraining only the height clamps the box off its ratio
rather than scaling it; pair a height with `w-auto` to size from the height instead. Don't
nest them.

## Best practices

Mirrored from the **Best practices** block on `↪ Aspect Ratio` (`40004379:65627`) in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Use it for media that has to keep its proportions — thumbnails, video, cover art — and let the grid set the width.

**Don't**

- Don't reach for it as a general layout container, don't nest one inside another, and don't constrain its height on its own.
