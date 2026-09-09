# Slider

Drag a handle along a track to pick a number, or a pair of them to pick a range.
Mirrors Figma node `40004155:14437`: `Type` default | range × `State` default | disabled, plus
the `Label`, `Sub Label`, `Min Value`, `Max Value`, `Marks`, `Min Number Input` and
`Max Number Input` booleans.
Built from two private sub-components, `40004155:14415` (_Slider Track, `Type` Filled | Empty)
and `40004155:14467` (_Slider Handle, `State` Default | Hover | Focus).
**Three of its four decisions went code-first and Figma caught up second**, which is the
unusual direction and the reason to read this entry carefully: the label, the disabled state and
the marks' 8px inset were all built here against a file that did not have them, then drawn into
the file afterwards — and the file drew all three exactly as built. Same direction as Badge's
four hues, Divider's `emphasis` and SegmentedControl's `large`. The `Sub Label` came back the
other way: Figma added it alongside the label, and it is `description` here.
**Reach for it when the number is approximate** — volume, opacity, a price filter. Astryx says
outright not to use one for precise numeric entry, and this one does not try.
**Eleventh Base UI component**, first on `Slider`. It supplies an `<input type="range">` per
thumb (so it submits with a form and announces as a slider), dragging, track presses, arrow
keys, Shift and Page Up/Down for the large step, Home/End, and the thumb-collision rules.
**`range` is derived, not a prop** — an array `value`/`defaultValue` gives that many thumbs, so
Figma's `Type` axis follows from what you pass. Avatar's `Content` and Button's icon-only again.
**The bounds labels are `font-mono`**, which is the file's choice and worth keeping: a
monospaced digit means the label cannot change width as the number does and shift the track
mid-drag. They label the *bounds*, not the value.
**The handle grows as you touch it, 16px to 20px** (`width/w-4` → `width/w-5`), in Hover, Focus
and while dragging. Switch's knob does the same thing at 14 → 16; this is the second component
where the file says so.
**Focus is `focusRingWithin`, not `focusRing`, and that is the interesting part.** `Slider.Thumb`
renders a div with a visually hidden input *inside* it, so focus lands on a descendant and
`focus-visible:` on the thumb fires on nothing. `has-focus-visible:` fires — which is exactly
what `focusRingWithin` already is, written for the card around a Checkbox. First component where
the ring is on one element and the focus on another, and still no new focus idiom. Per-thumb
focus must come from `:focus-visible` rather than Base UI's `data-focused`: that is the *root's*
state, so on a range both handles would light up at once.
**The hit area is the Control, not the handle's frame.** Figma draws a 24px frame round the disc
because on a canvas that is the only place a target can live; Base UI listens on
`Slider.Control`, so the height goes there (`h-6`, Figma's 24) with the 4px track centered in it.
**`thumbAlignment="edge"`, not Base UI's default `center`.** Figma centers the handle on the end
of the filled track, and at `min` that hangs 8px past the control — exactly the row's `gap-2`,
which is presumably why the gap is 8. But the disc grows to 20px and the ring adds 4px, and a
focused handle at `min` then **paints 6px over the bounds label**. `edge` insets it;
the ring lands in the gap with 4px to spare, and nothing is lost visually because the
indicator's 8px stub at `min` sits under the handle. Figma cannot settle this one — it draws the
handle's focus state in isolation and never on a composed slider.
**Marks paint behind the track**, per Figma's z-order, so all you see of a tick is the 2px
poking out above and below; the tick uses the same `Surface/Border` as the unfilled track. The
marks layer is **`inset-x-2` — the handle's radius, and load-bearing**: `edge` alignment makes a
handle travel between points 8px in from the control's edges, so ticks laid across the full
width drift from the handle by up to 8px at the ends. Derived by measuring, and **the file now
agrees** — the Marks frame is `left: 8px; right: 8px` where it used to be flush. `relative z-10`
on the track is load-bearing too: an absolutely positioned sibling paints over a static one
whatever the DOM order.
**Room for the mark labels goes on the root, not the row.** It was on the row first and that is
wrong: padding there shrinks the box `items-center` centers the control in, so the track rides
4px higher and the labels *still* overflowed, measured at exactly 4px. On the root, 10px
(4 under the track + 20 of line-height − the 14 a centered 4px track leaves in a 32px row).
**The value tooltip composes `Tooltip`** rather than being a second popup — `sideOffset={8}` is
Figma's gap, not Tooltip's default 4 — and it needs no state: `Slider.Value` reads the live value
out of the slider's context, which reaches the popup through the portal. Two things verified in
the browser rather than assumed: it opens on keyboard focus as well as hover, even though the
focus lands inside the trigger; and `aria-describedby` reaches the right element, because Base UI
**hoists that attribute off the Thumb and onto its hidden input**. It covers the label while you
drag, which no offset avoids — Base UI only flips at the viewport edge, not off a sibling.
**The label and its sub-label are one block, 8px above the row**, stacked with no gap between
them — 24px of line-height then 20 — which is Figma's `Label` frame. `description` is Figma's
`Sub Label`, named for Checkbox, Radio and Switch. **It is part of the accessible name, not a
description:** it sits inside Base UI's `Slider.Label`, which is both Figma's structure and the
only option left, because `aria-describedby` on a thumb is already taken by the value tooltip and
a second source would overwrite the first. Keep a sub-label short enough to be read as part of a
control's name. Figma's `overflow-clip` on the frame is not ported, the seventh time.
**Disabled lives on the Slider, not on the handle** — `_Slider Handle` still has only Default |
Hover | Focus — so it is one `opacity/opacity-40` fade over the whole component rather than a
disabled token per part. Which is what keeps the next note load-bearing.
**`aria-disabled` on the root is not decoration.** `disabled` is the library's `opacity-40`,
which drops the bounds labels to 2.33:1. WCAG 1.4.3 exempts inactive components and axe
implements that by walking up from the text for a disabled control or `aria-disabled="true"` —
so Checkbox, Radio and Switch get it free, their whole row being a `<label>` for a disabled
input. A bounds label is a plain `<span>` in a `<div>`, so without this the story suite fails on
`color-contrast`. Valid because `Slider.Root` renders `role="group"`.
**The props are a union** — `label` or `aria-label`, so an unnamed slider will not compile
(Button's icon-only precedent, and Astryx's first rule for this component). With no visible
label the `aria-label` reaches **every** thumb, not just a lone one: Base UI only fills
`aria-labelledby` when a `Slider.Label` exists, so a range would otherwise carry two unnamed
inputs, and `thumbLabels` being optional means the types could not catch it.
**Story-typing trap:** this is the one file using `StoryObj<typeof Slider>` instead of
`StoryObj<typeof meta>`. Storybook works out which args a story still owes by running `Omit`
over the props, and `Omit` does not distribute across a union — it collapses to the shared keys,
so the inference either demands `args` on every story or reduces them to `never`. Button has the
same union and escapes it because its discriminator (`children`) is already an arg.
**Sixth component on the motion tokens**, and the transition is deliberately narrow —
`duration-fast-min` on width and height only. **Do not transition the thumb's inset or the
indicator's width:** Base UI drives both straight from the pointer, so the handle would drag on
elastic behind the cursor, and there is no animating a keyboard step without also animating the
drag. Switch's "11px reads as lag" from the other end.
**`overflow-clip` not ported, for the sixth time** — the handle overhangs the control by design.
**32px row, 4px track, 24px control, 16/20 handle, 2×8 tick nubs, 8px gaps and 10px reserved
for mark labels are the numbers to check.**
Left out: `orientation="vertical"` (Base UI and Astryx have it, Figma draws no vertical variant — omitted
from the props rather than left to break quietly, Tabs' call), and `invalid` — **now closed as a
deliberate non-change rather than a deferral.** Figma's `State` axis here is default | disabled
with no invalid, and Field's `Type` list does not include Slider, so there is no drawn treatment
for an invalid slider and inventing one would be the second source of truth this component
already refused once over its number input. Checkbox, Radio and Switch were migrated in the same
PR precisely because the file *does* draw their invalid state.
**The number inputs are built, and they were the component's one outstanding debt.** Figma draws a
56x32 field at the trailing edge and a second at the leading edge for `Type=Range` — instances of
the **Input** component, which did not exist when Slider was written. It does now, and `NumberInput`
after it, so the field is **`NumberInput` with `steppers={false}`**: Input's own box, left-aligned,
at exactly the height drawn. No new chrome, which is precisely why this waited rather than being
invented — the same second-source-of-truth argument that still keeps `invalid` out.
**Two Figma booleans, one prop.** `Min Number Input` and `Max Number Input` collapse to
`numberInput`, the way `Min Value` and `Max Value` already collapse to `bounds`, and the *count* is
derived from the value like everything else here: one thumb gets one field at the trailing edge, a
range gets one at each end. The file itself does not treat the two as a symmetric pair —
`Type=Default` has no leading field node at all — so a second boolean would have had nothing to
switch. Both of Figma's default to true, so `numberInput` does.
**The leading field sits *outside* the min bounds label**, not between it and the track. That is
Figma's order and the one thing about the row that is not guessable:
`[field] [0] ——track—— [100] [field]`.
**`valueTooltip` now derives from it** — `!numberInput` — because a field already showing the value
makes a tooltip repeating it under the cursor the same number twice. Pass either explicitly to
override.
**The component is now controlled from the inside.** Two controls write one value and a field cannot
show a number Base UI is keeping to itself, so the value is held here — mirrored uncontrolled state,
or the caller's `value` when there is one — and `Slider.Root` is always given a controlled `value`.
DatePicker's arrangement. The consequence is that a typed edit has to *build* a Base UI event-details
object to hand to `onValueChange`, since a keystroke in a sibling control is not one of Base UI's
own reasons: `createChangeEventDetails('input-change', …)` from the `internals/createBaseUIEventDetails`
subpath, which the package really does export. **This is the library's first `internals/` import**;
writing the object out by hand would be a copy that drifts.
**Dragging pushes, typing clamps** — a deliberate divergence, and the clamp is in `commitThumb`
rather than on the field. `NumberInput`'s own `min`/`max` only bite when the field commits, so a
keystroke arrives unclamped and `[90, 80]` — an unsorted range — went straight out to a controlled
caller's `onValueChange` before Base UI tidied it on the way back in. Measured: the *screen* was
right (Base UI resolved it to `[80, 80]`) and the value the caller saw was not. That is the shape of
bug to watch for whenever a second control writes a primitive's state.
**56px is a floor, not a fixed width, and Figma's own `Formatted` case is why.** 56 less 24px of
`px-3` and two borders leaves 32px for three characters, which `100` and `100%` fit and `£1,000` does
not — the story rendered `£25(`, clipped mid-glyph. So the width is
`max(56px, chars × 10px + 26px)`, where `chars` is the character count of the longer **formatted
bound** passed in as `--slider-field-chars`. **The 10px rate comes out of Figma's field, not out of
the font**: the file allots a shade under 11px per character, and taking 10 makes the
three-character case land on exactly 56, so the default slider is the drawn width to the pixel
(measured: 56.00). `ch` was tried first and is the wrong unit — it resolves against the box, at the
inherited 16px, while the text that must fit is in the `<input>` at 14, so it measured 10.09px
against an 8.83px digit and quietly took the calc branch at the drawn scale.
**The indicator needs `w-[max(0px,var(--relative-size))]!`, and only on a range.** Base UI sizes the
filled track by writing `--relative-size` — the gap between two thumb positions — inline. Under
`thumbAlignment="edge"` each position carries a half-thumb inset as a percentage of the control, so
when a range's two thumbs hold the *same* value the subtraction lands on a rounding artifact rather
than on zero, and **its sign depends on the control's width**: `-0.0115%` at a 206px control against
`+0.354%` at ~310. A negative percentage is an invalid `width`, the browser drops the declaration,
and the indicator fills its whole parent — a solid bar painting out over the bounds label and the
field beside it. The bug is older than the fields; they are what narrowed the control enough to flip
the sign. **It has to be a variant rather than base**, because a single-thumb slider is sized by
`width: var(--start-position)` and has no `--relative-size` at all — put the guard in the base and
the single case gets an invalid width and fills the track. Both halves measured.
**Each field is named, because Base UI does not name it.** `Slider.Label` names the *thumbs*; a
NumberField is a separate control in the same group and gets nothing. `thumbLabels` first, since it
already names the same value; otherwise the slider's own name, qualified on a range with an sr-only
`minimum`/`maximum` concatenated through `aria-labelledby` — `label` is a ReactNode, so there is no
string to append to. Verified in the browser: "Disabled range minimum", "Disabled range maximum".
**The disabled fade is cancelled, not applied.** `Input`'s box fades itself when it contains a
disabled control, which is right standalone and wrong inside a disabled Slider — the root is already
`opacity-40` and the two compound to 16%. `has-[:disabled]:opacity-100` cancels it, which works
because the variant prefix is tailwind-merge's key: same prefix, same utility, later one wins. Figma
says the same thing by leaving both `State=Disabled` variants' Input instances at `State=Default`
and fading the whole component once. The fields are still really `disabled`.
Worth knowing if that changes: Base UI would already do the labeling half of it —
`ariaLabelledby = ariaLabelledByProp ?? resolveAriaLabelledBy(fieldLabelId, …)` in `SliderRoot`,
read out of `node_modules` — so a Slider inside a Field is named by the Field without needing its
own `Slider.Label`. The blocker is the props union: `label` or `aria-label` is *required*, so
`<Field label="Volume"><Slider /></Field>` does not compile. Relaxing that to enable an undrawn
composition would trade away the guarantee that an unnamed slider cannot ship, which is a bad
trade until Figma draws `Type=Slider`.
**The label question, settled deliberately.** Base UI's `Field` could own labeling instead —
`Field.Label` beats `Slider.Label`, since `SliderRoot` resolves `fieldLabelId ?? localLabelId`,
so the two never collide and a slider inside a Field simply stops using its own. The call was to
keep the label on the control, matching Astryx and matching what Figma now draws; a Field wrapper
is friction for the common case, and a slider almost always needs a name. Note the difference
that makes this safe to do here but not a precedent for the other three: Checkbox, Radio and
Switch labels are `<label>` elements *wrapping* the control, which is what makes the text a hit
target, and they cannot hand that to a Field sitting outside them. A slider's label is not a hit
target. **Field has since been built, and it is for `invalid`, `description` and the `data-invalid`
family, not for labels** — which is the deferred note in Checkbox, Radio and here.
**The rule the file settled on, stated once:** a control with no label of its own gets one from
Field (Input, Input Group, Select, Autocomplete, Combobox); a control whose label is a *hit
target* keeps it, and Field's label names the set above it instead (Checkbox, Radio, Switch).
Slider is the single exception in neither camp — its label is not a hit target, but Base UI needs
`Slider.Label` to name the thumbs and Figma leaves it out of Field's `Type` list — so it keeps its
own. It follows Field on **weight** though: semibold, like every other field label in the
library.
**Wants adding to Figma:** only the tick's `--radius/full` binding now, which is the one radius
in the file not named `--border-radius/rounded-*` — cosmetic, both resolve to 9999.

## Best practices

Mirrored from the **Best practices** block on `↪ Slider` (`40004242:15082`) in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Reach for it when the number is approximate: a volume, an opacity, a price filter.
- Give it a label, or an aria-label. An unnamed slider will not compile, and a range would otherwise carry two unnamed thumbs.
- Pass an array value when two ends are being picked. The range follows from the value rather than from a prop.

**Don't**

- Do not use a slider for a number somebody has to be exact about. Pair it with an input, or use the input alone.
- Do not put the chosen value in the bounds labels. They label where the track starts and ends.
- Do not use a slider for a handful of steps. That is a Segmented Control or a Radio Group.
