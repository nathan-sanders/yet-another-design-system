# Checkbox

A box you tick to turn one thing on or off. Mirrors Figma node `40004007:4067`:
`In Container` false | true × `State` default | hover | focus | invalid | disabled ×
`Selected State` default | indeterminate | selected, plus the `Label`, `Sub Label` and `Slot`
booleans. Twenty-four of the thirty combinations are drawn; the gaps are all "hover or invalid
on an already-ticked box", which the CSS covers anyway.
**Seventh Base UI component**, first on `Checkbox`. It supplies `role="checkbox"`,
`aria-checked` (including `"mixed"`), the hidden `<input type="checkbox">` that makes it submit
with a form, and `data-checked` / `data-unchecked` / `data-indeterminate`.
**Indeterminate is a prop, not a third value of `checked`** — which matches the DOM, where
`input.indeterminate` has always been separate. The glyph is chosen from the prop rather than
from Base UI's state, because a box can be indeterminate whether or not it is also checked.
Ticked and indeterminate share one fill (`input-selected` for background *and* border) and
differ only in the glyph: `Check` or `Minus`, at 14px because Figma binds `width/w-3,5` and
Icon's own scale is 12/16/20/24 — the one place a `className` overrides an Icon size.
**The row is a real `<label>`**, which is what makes clicking the text toggle the box, and is
the path Base UI supports for naming a root that is not a native button. **This is the opposite
call from SegmentedControl**, which pairs `nativeButton` with `render={<button>}`: a segment
sits in a radiogroup with roving tabindex and no label element around it, so it has to be a
button to get `:focus-visible`. A checkbox already has one wrapped round it. Verified in the
browser: `aria-labelledby` resolves to the label text, and label-click and box-click both toggle.
**The card's line is an `inset-ring`, not a border.** Figma draws the container 40px tall —
24 of line-height plus 8 above and below — and a border would add its 2px on top and make it 42.
A ring is a shadow, so it costs no layout. That is Avatar's trick, and the card keeps that 1px
line unchanged on focus: the shared ring goes round the outside of it, and the box inside draws
**no** ring of its own, because two concentric rings on one control read as a mistake.
**40 is the number to check**, and 20 for the box.
`invalid` is a prop rather than a CSS state, and the one member of Figma's `State` axis that
stays one. **Migrated onto Field:** the box now also carries `data-invalid:` rules, so a
Field can drive it — Base UI's `fieldValidityMapping` turns the Field's `valid: false` into
`data-invalid` on the checkbox root — and the card, being a plain `<label>` rather than a Base UI
part, reads it off the control inside with `has-[[data-invalid]]:`. The prop stays as the
standalone path Figma draws, and the two compose: either lights the border. Prefer the Field
wherever there is a message, since only it can carry one.
**Open question for Figma:** the box is centered against the whole label block, which is what
Figma's auto-layout does, but most systems top-align once a sub-label makes the text two lines.
**`Checkbox.Group`** — Figma's Checkbox Group set (node `40004010:5118`): `Layout` Vertical |
Horizontal plus a `Select All Option` boolean. **Fifteenth Base UI component.** The group owns
the array value and the parent checkbox's arithmetic, which the `Parent` story used to do by
hand and no longer exists to do.
**The glyph had to stop being chosen from a prop.** `indeterminate ? Minus : Check` is correct
only while a caller sets `indeterminate`; a `parent` checkbox has it *computed* by Base UI from
the values around it (`indeterminate = computedIndeterminate` in `CheckboxRoot`), so it never
arrives as a prop and a half-selected parent drew a tick. Both glyphs are rendered now and one is
hidden off `data-indeterminate`, which covers the explicit and the computed case with one rule.
Verified: the parent reports `aria-checked="mixed"` and shows the `-`.
**`selectAll` needs `allValues`** — Base UI compares it against the current value to decide the
parent's three states, and cannot know the options nobody has ticked without being told.
**Options are matched by `name`, not `value`**, which is the one thing about this API that reads
wrong beside `Radio.Group`.
The **Divider is a real Divider instance**, as Figma draws it, and it is safe here where it was
not in Tabs: `CheckboxGroup` renders `role="group"`, which has no required-children rule for a
`role="separator"` to violate — checked with axe rather than assumed.
**129 and 65 are the numbers to check**, against Figma's 128 and 64. The 1px is the divider, and
it is Avatar's outside-stroke trap again: Figma draws the Divider frame 0px tall with its line
hanging outside, where a real 1px separator takes 1px of layout. The code is right and the frame
is the thing that cannot represent it.

## Best practices

Mirrored from the **Best practices** block on `↪ Checkbox` (`40004242:14797`) and `↪ Checkbox Group` (`40004242:14816`) in Figma.
The two are one text in two places — change one and change the other.

### Checkbox

**Do**

- Use it for an intention that a Save button later commits.
- Word the label as the thing being turned on, so the meaning of a tick is obvious without reading the state.
- Wrap a set in a Field. Only the Field can carry a message, and it marks every control inside it invalid at once.

**Don't**

- Do not use a checkbox for something that takes effect the moment you let go. That is a Switch.
- Do not offer indeterminate as a third thing somebody can pick. It reports the state of the boxes underneath it.
- Do not use a lone checkbox where exactly one of several is meant. Radio is for one, checkboxes are for any number.

### Checkbox Group

**Do**

- Reach for the group whenever the boxes belong together. It owns the array value and the parent checkbox's arithmetic.
- Put the question on a Field above the group. The Field names the set; each box keeps its own label.
- Pass allValues alongside a select-all option, or the parent cannot tell all from some.

**Don't**

- Do not compute the parent's mixed state by hand. The group already does it, and a half-selected parent drawing a tick is the usual result.
- Do not run a long list horizontally. Vertical is easier to scan and does not wrap awkwardly.
- Do not use a checkbox group where only one answer is allowed. Radio Group is the shape for that.
