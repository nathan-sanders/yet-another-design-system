# VerticalBar

A magnitude per category, as columns. Figma's `Vertical Bar` (`40004343:17007`), section
`40004343:17006`. **Read [Chart/CLAUDE.md](../Chart/CLAUDE.md) first.**

## Figma's three bar types are one boolean

`Bar Type` is Single / Stacked / Group. **Single and Group are the same drawing** — bars side by
side — differing only in how many series there are, which the caller's `series` array already says
and cannot contradict. Figma needs three variants because a Figma component cannot count its own
children.

The only genuine choice left is whether bars sit *beside* each other or *on top of* each other, and
that is `stacked`. This is the same "derive it from what you were passed" rule that removed
Button's `iconOnly` and Slider's `range`.

## `stacked` defaults to false, and that is a claim about data

Stacking asserts the parts sum to a meaningful whole. When they do, it is the better chart. When they
do not, it invents a total the reader will try to read anyway — and nothing on the chart warns them.
Grouped makes no such claim, so it is the safe default and stacking is opted into.

Figma's hero example *is* stacked, and that is not a contradiction: there the three series genuinely
are parts of one figure. The default is about the charts nobody has designed yet.

`showTotal` on the tooltip follows the same logic, defaulting to `stacked` — a Total row appears
exactly when a total is a real number rather than an accident of addition.

## The segment shape, and the bug worth not repeating

Figma rounds all four corners of **every** stacked segment and puts a 1px gap between them, so a
stack reads as a column of discrete blocks rather than one bar with color changes. Recharts stacks
flush and has no concept of a gap, so each segment goes through a custom shape — see
[`Chart/bars.tsx`](../Chart/bars.tsx).

**The gap comes off each segment's top, and the exemption belongs to the topmost segment.** The
intuitive answer is the opposite and it is wrong: shrinking a segment's top opens the space against
whatever is *above* it, so every segment needs it except the one with nothing above. Exempting the
bottom segment instead — the first guess, and what shipped in the first draft here — leaves the
lowest two segments welded together with no gap at all.

**That bug was invisible in a screenshot and obvious in a measurement**, at 1px across 31 columns.
It is pinned in `Chart/bars.test.ts`, which asserts the property rather than the pixels: every
neighbouring pair in a stack is separated by exactly the gap, and the bottom of the stack still sits
on the baseline.

## Bar width and the two category gaps

Bars cap at **24px**. Figma's `Segment` is intrinsically 16 (single, stacked) and 24 (grouped), but
those are the component's size on the canvas — a real chart distributes bars across whatever width it
has, and pinning them to 16 would leave a wide chart mostly empty. The cap is the part that
transfers: past 24 a bar stops reading as a measured length and starts reading as a block of color,
and the band's leftover is meant to be air.

**`barCategoryGap` is taken off *each* side of the band, so the number is half what it looks like.**
25% leaves only half the band for bars, which is how the grouped chart first came out at 7px a bar.
The two modes then want different values, for a real reason: a stacked chart puts one column in the
band and can spend the rest on air (20%, which is roughly what Figma draws); a grouped chart has to
fit every series in the same band, so air is what it can least afford (10%).

## The tooltip cursor is a band, not a rule

A bar occupies width. A hairline down the middle of a 24px column looks like it is pointing between
two bars rather than at one, so the cursor is a translucent band covering the whole category. The
line charts keep the rule, because there the mark is a point and a rule through it is exact.

## `accessibilityOverlay`

Off by default, because Figma's own bar examples do not draw it. It exists for a chart using one of
the three categorical colors that fall short of 3:1 on the light canvas — `04` yellow at 1.74:1
above all — where a large flat fill is genuinely hard to find against the surface. It is the
sanctioned mitigation the root `CLAUDE.md` points to, and the reason those three colors are allowed
to stay as they are.
