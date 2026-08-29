# Radio

Pick exactly one option from a list you can see all of. Mirrors Figma node
`40004007:4096`: `In Container` × `State` (default | hover | focus | invalid | disabled) ×
`Selected State`, plus `Label` and `Sub Label`. Composed API: `<Radio.Group>` + `<Radio>`.
**Eighth Base UI component**, on the same `RadioGroup` + `Radio` pair SegmentedControl uses.
**This is a list; SegmentedControl is a control.** Both are one-of-many on the same primitive,
and the difference is presentation, not semantics: a segmented control is a compact strip you
put beside a Button, a radio list is a stack of labeled options with room for a sentence under
each. Reach for this when the options need explaining.
**Selection follows focus**, as in SegmentedControl and as a radiogroup should — verified in the
browser: ArrowDown moves *and* selects, and exactly one stays checked.
**The selected dial is a flattened vector in Figma** with no variables bound, so its geometry was
read off the exported SVG rather than guessed: a 20px circle filled with Input/Selected, and a
`r="4"` — 8px across — glyph in Input/Selected Foreground. Measured back at 20×20 and 8×8.
Migrated onto Field alongside Checkbox, and by the same two mechanisms — `data-invalid:` on
the dial, `has-[[data-invalid]]:` on the card — so a Field can mark a whole group invalid and
carry the message, which is what you almost always mean rather than one option being wrong.
The row, card and label column are the same shapes Checkbox draws, and the recipes are a
**deliberate copy rather than a shared module**: Figma keeps the two as separate component sets
that can drift, and this library's precedent for sharing styles (Avatar/AvatarGroup) is a
`styles.ts` inside one folder, not a module spanning two. If a third control needs this row,
that is the point to extract it. Card is 40px, dial 20px — **the numbers to check.**
**`Radio.Group`** is now Figma's "Radio Group" set (node `40004010:5003`), whose only property
is `Layout` Vertical | Horizontal. It owns the value, the roving tabindex and the arrow keys, so
a `Radio` outside one does nothing. The stack is `gap-2`, which is a correction: it was `gap-3`
when the group was scaffolding rather than a component, and the file says 8px.
**`orientation` is presentation only and deliberately not passed to Base UI.** Its composite
defaults to `orientation: 'both'` (read out of `useCompositeRoot`), so all four arrow keys move
between options whichever way the row runs — verified in the browser: on a horizontal group
ArrowRight steps forward *and* ArrowDown wraps 3 → 1. Constraining it to one axis would take away
working keys for nothing.
**88 vertical and 24 horizontal are the numbers to check**, with a horizontal row dividing its
width evenly (`flex-1` + `min-w-px` per option) rather than hugging the labels.
This is Astryx's `RadioList`, and its guidance holds: two to seven options, and not horizontal
past four because it wraps awkwardly. Everything else Astryx builds into that component — the
group's label, its description, the required marker, the message — is `Field`'s job here, which
is what Figma says too by giving Field a `Type=Radio` variant.
Naming: Figma calls the property `Layout`, and the prop is `orientation`, after Divider's — the
library already spends `layout` on hug-or-fill in SegmentedControl and Tabs.
