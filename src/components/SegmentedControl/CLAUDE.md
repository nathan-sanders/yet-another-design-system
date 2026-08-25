# SegmentedControl

Pick one of a small set of mutually exclusive options, all visible at
once. Mirrors Figma nodes `40004127:14774` (Segment Control, `Appearance` Secondary | Ghost) and
`40002016:7049` (Segments, `Active` × `State` × `Size`). Composed API, like Breadcrumbs:
`<SegmentedControl>` + `<SegmentedControl.Item>`.
`appearance`: secondary | ghost — the same track token pairs Button's two appearances use, which
is what makes it pair with them. `size`: small | default | large. `layout`: hug | fill.
**Labels come from the Content ramp, not the Action one:** unselected is `content-primary` and
selected darkens to `content-emphasized`, so selection is carried by colour as well as by weight
and the raised card — and in dark mode that reads stone-100 → white, which is what keeps the
selected segment legible when its card (`surface-primary`, stone-900) is *darker* than the
track. Hover changes only the background. Focus darkens the label to `content-emphasized` too;
that is a no-op on a selected segment and only shows on a group rendered with nothing selected.
**Fourth Base UI component, first built on `RadioGroup` + `Radio`.** It is an *input*, not
navigation, so it renders `role="radiogroup"` → `role="radio"` with `aria-checked`, roving
tabindex and arrow-key movement — the same DOM Astryx emits. That is *why* it is not a
ToggleGroup: a group of `aria-pressed` toggles can be left with nothing selected, and a segmented
control always has exactly one. Tabs are wrong for the opposite reason — they navigate between
panels — which is item 9 below, on Base UI `Tabs`.
**Base UI's `Radio` renders a `<span>`** (inside a group, a `CompositeItem` with `tag: "span"`).
It takes **both** `nativeButton` and `render={<button type="button" />}` to become a real button —
that pairing is what gives `:focus-visible` and the native `disabled` attribute.
**Selection follows focus:** `RadioGroup` clicks the hidden input on arrow-key focus. Correct
radiogroup behaviour, and what Astryx does. Don't fight it. `enableHomeAndEndKeys` is off, so
Home/End do nothing here (Button's toolbar cousins differ).
**Heights are Button's, and they fall out of the parts:** a 20px segment inside 1px of padding
inside a 1px border is 24px, and the same for 28→32 and 36→40. **24 / 32 / 40 are the numbers to
check** when this changes. Horizontal padding does *not* follow Button: it steps 8 / 12 / 12, so
large is taller but no wider, where Button goes 8 / 12 / 16. The track itself has no `Size`
property in Figma — it takes its height from the segments inside it.
Segments are a fixed `h-*`, not Figma's `min-h`, and each carries a transparent 1px border at rest
so selecting one doesn't grow it.
**Do not add `overflow-clip` to the track**, even though Figma has it. Figma draws focus as an
overlay *inside* the segment; here the shared ring paints 4px outside a segment that sits 1px in
from the track edge, so clipping would slice the ring off the first and last segments.
**Second component to use the motion tokens**, after Tooltip: `duration-fast-min` +
`ease-standard` crossfading colour, background, border and shadow. Astryx measures at 125ms on
`cubic-bezier(0.24, 1, 0.4, 1)` — the same curve, and 130ms is the nearest token. No sliding
indicator: that needs the JS layout library this system deliberately turned down.
**A `Tooltip` composes onto a segment** — Tooltip hands `children` to Base UI's `render`, so the
segment's own `<button>` becomes the trigger and keeps its roving tabindex and arrow keys. That
is what Tooltip's `SharedDelay` story is built from now. A tooltip still only *describes*: an
icon-only segment needs its own `aria-label`, which the union prop type requires anyway.
**`layout="fill"`** is the one thing here Figma does not draw — Astryx's, for a fixed-width
panel, and a gap in the file rather than an invention. Figma's focus ring is drawn at
`rounded-xs` on a `rounded-sm` segment — an artefact of it being a separate overlay layer; the
segment's own radius is used instead, as in Button.
This component shipped first and Figma caught up second, which is the reverse of the usual
direction: `large` and the Content-ramp label colours were both added to the file afterwards
(as with Badge's four hues and Divider's `emphasis`), then synced back into the code. Large's
`px-3` and the `content-primary` / `content-emphasized` pair came from Figma, not from us.
