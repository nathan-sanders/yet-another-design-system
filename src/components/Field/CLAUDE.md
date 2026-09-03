# Field

The label, sub-label and validation message around a form control. Mirrors Figma node
`40004051:15082`, whose `Type` property swaps the control: Input, Input Group, Autocomplete,
Select, Combobox, Checkbox, Checkbox Group, Radio. **Fourteenth Base UI component.**
**This is the set that settled who owns the label**, and it is worth knowing how it was found:
Input shipped first with its own label block, matching the Input set, and only then did the
Field set turn up — nesting that same Input with `label={false}`. The file had been explicit all
along; the Input set's own Label booleans are the vestige, not this. So Input's chrome was pulled
back out and moved here, one PR later, while nothing consumed it yet.
**`Type` is derived, not declared** — what you pass as children decides it, the way Avatar's
content follows from `src`/`name`/`count` and Button's icon-only form from having no label. A
Field cannot be wrong about what is inside it.
**It labels a group as readily as a control.** Figma's `Type=Checkbox` and `Type=Radio` put this
label *above* controls that already have their own — a legend over a set, not a second name for
one box. That is what makes it compatible with Checkbox, Radio and Switch keeping their wrapping
`<label>`, which is what makes their text a hit target. The split to remember: Input and Slider
hand their labels over because their labels are not hit targets; the other three do not.
**The ARIA is Base UI's, which is the whole reason not to hand-roll this.** `Field.Label` gets
`htmlFor` pointed at the control, and `Field.Description` and `Field.Error` are both folded into
its `aria-describedby` — verified in the browser: the label resolves as the name and both others
as the description. No `useId` anywhere, unlike Tooltip.
`Field.Root`'s `invalid` prop is Base UI's documented path for validity decided outside the
component, and it is what puts `aria-invalid` on the control and `data-invalid` on every part —
which is what Input's border color hangs off. `Field.Error` takes `match` so the message shows
because the caller said so rather than because the browser found a native constraint violation.
`validate` / `validationMode` / `validationDebounceTime` are deliberately **not** surfaced: this
is presentational, and deciding *when* a value is wrong belongs to a Form component that does not
exist yet.
**`error` implies `invalid`.** A danger-red message beside a neutral border would read as a bug.
**The validity reaches the control, which is the point of the whole component.** `Field.Root`'s
`invalid` becomes `data-invalid` on whatever is inside — Base UI's `fieldValidityMapping` turns
`valid: false` into that attribute — and Input, InputGroup, Checkbox, Radio and Switch all hang
their own invalid styling off it. Verified in the browser rather than assumed: one Field marks a
checkbox, two radios and a switch at `feedback-danger-highlight` without any of them being passed
a prop. Each keeps its own `invalid` prop for standing alone, and the two compose.
**The sub-label defaults off**, as it does in the file — the label is the requirement.
**The label is semibold, and the file disagreed with itself about that.** The Input and Input
Group sets drew theirs at `font-weight/normal` while Select already drew 600 — so those two were
the holdouts, not this. Resolved by deletion rather than by syncing copies: Input, Input Group,
Select, Autocomplete and Combobox have all had their own label properties removed, so there is
one label in the file and nothing left to disagree. **600 is the number to check.** Slider is the
only control still drawing its own, and it moved to semibold to match — code-first, so the Slider
set wants updating from `normal`. **Still open:** Slider's label is `Content/Primary` where this
one is `Content/Emphasized`. Only the weight was aligned; the color is left for the file.
**The validation message is italic** — `text-sm`, Content/Danger. Italic is this system's mark
for text that is not something the person entered; the placeholder inside a field is italic for
the same reason, and missing it is easy because a screenshot does not show it.
**`aria-disabled` on the root is not decoration**, for the third time after Slider and Link.
`opacity-40` measures about 2:1, and axe only exempts disabled text by walking up for a disabled
control or `aria-disabled="true"`. The label gets that exemption free — it is a `<label>` for a
disabled input — but the sub-label and the message are not labels and fail `color-contrast`
without it. `a11y.test` is `'error'`, so this breaks the build rather than merely looking wrong.
**The disabled fade lives on the control's box, not here**, or the two multiply to 16% when both
apply. Only the three text parts fade here, each off its own `data-disabled`.
Left out: a `size` axis — Figma's Field has none, and the control carries its own.

## Best practices

Mirrored from the **Best practices** block on `↪ Field` (`40004242:14892`) in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Wrap every form control in a Field, so the label, the sub-label and the message are wired to it without anybody writing an id.
- Let the Field carry validity. Marking it invalid reaches the control inside and colors its own border.
- Use the sub-label for what somebody needs before they answer, not for what they get told afterwards.

**Don't**

- Do not use the placeholder as the label. It goes the moment somebody types, and it is italic because it is not something they entered.
- Do not add a second label to a Checkbox, Radio or Switch. Their own label is what makes the text clickable; the Field names the set above them.
- Do not show a red message beside a neutral border. A message implies the field is invalid, and it should be marked as such.
