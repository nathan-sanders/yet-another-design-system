# Banner

A persistent message about the page or section it sits in. Mirrors Figma node
`40004135:15894`: `Type` info | success | warning | danger × `Floating` false | true, which is the
whole variant set. Figma's Title / Description / Has Action / Is Dismissable booleans become
slots: `title`, `children`, `action`, `onDismiss`.
**The first consumer of the `feedback-*` tokens.** They have existed since the first export with
nothing using them — every other component draws on Action, Content or Decorative. Each type is a
`Background` + `Foreground` pair already tuned for contrast in both themes, so there is no `dark:`
class and nothing to solve. The ramp's `Highlight` goes unused: Figma's Banner has no border, the
same call as Badge.
Not a Base UI component — there is no headless Banner or Alert primitive, so it is a native
`<div>` like Badge. What it takes from Astryx is the composition and the a11y model.
**Role is derived from `type`,** which is what Astryx's own DOM does: info/success render
`role="status"` (polite), warning/danger render `role="alert"` (interrupts). It is set before the
props spread, so a caller can override it when the banner already sits in a live region.
**Dismissal is the caller's.** Passing `onDismiss` renders the close button and Banner never hides
itself — derived-from-what-you-pass, as Button derives icon-only from having no label, and it
keeps Banner stateless like everything else here. Astryx self-hides with internal state; a banner
that quietly returns on the next render is the worse surprise. The button is just
`<Button appearance="overlay" size="small" startIcon={X} aria-label>` — overlay is the one
appearance that works on all four feedback backgrounds, because its own background is a dark
translucent wash rather than a theme color. Its union prop type already requires the label.
**Naming trap, the mirror of Divider's.** `title` is a real DOM attribute on every element (the
browser's hover tooltip), typed `string`, so `ComponentPropsWithRef<'div'>` has to be
`Omit`ed to retype it as a ReactNode. Divider resolved the same collision the other way and
renamed its prop to `lineStyle`; here the prop name is the right one, so the attribute gives way.
**The icon rail's `py-1` is load-bearing:** 4px above a 16px glyph centers it on the 24px
line-height of the title beside it. Measured at exactly 0.0px offset; drop it and the glyph
top-aligns and reads high.
**Do not port Figma's `overflow-clip`** — nothing overflows, and it is SegmentedControl's
clipped-focus-ring hazard. Verified `overflow: visible`, with 16px/12px of room between the
dismiss button and the banner's edge for its 4px ring.
Width is `w-full`: Figma's 400px is a canvas frame, not a constraint.
**48 / 72 are the numbers to check** — title-only, and title + description (12 + 24 + 24 + 12).
**Story trap:** the variant matrix is a grid, not Badge's `<table>`. A `w-full` component in an
auto-layout table cell collapses to its longest word (measured 77px instead of 320). And the
corner cell cannot be Badge's `sr-only` span — `sr-only` is `position: absolute`, so it drops out
of grid flow and shifts every row one column left.
Left out of Astryx: `container="section"` (full-bleed, no radius), the collapsible
`children`/`defaultIsExpanded` detail area, and the four-step `elevation` scale — Figma draws one
raised state, so that is the `floating` boolean. Its `icon` override is kept.
**The `icon` override exists in Figma too, as an exposed nested instance** — the mechanism Button
and Badge already use for their icon slots. Not an `INSTANCE_SWAP` property: no component set in
the file uses one, and a set-level swap property carries a single shared default, which would
flatten the four per-type glyphs into one. Exposing the nested instance keeps each variant's own
glyph as its default. Seven of the eight variants were already exposed; `Type=Info, Floating=False`
— the default variant — was not, which is worth knowing as a shape of bug this file can carry:
a property set on every variant *except* the default one reads as fine until someone drops in a
fresh instance.
