# Switch

Flip a setting on or off, and it takes effect straight away. Mirrors Figma node
`40004060:16435`: `In Container` false | true × `State` default | hover | focus | disabled ×
`Selected State` default | selected, plus the `Label`, `Sub Label` and `Slot` booleans.
**Checkbox's immediate twin, and they are not interchangeable:** a checkbox states an intention
that a Save button later commits, a switch *is* the commit. Reach for Checkbox inside a form and
for this when the thing happens the moment you let go. The two stories' `InContext` panels are
written to be read against each other for exactly that reason.
**Tenth Base UI component**, first on `Switch`. It supplies `role="switch"`, `aria-checked`,
`aria-labelledby` resolved through the wrapping label, the hidden `<input type="checkbox">`, and
`data-checked` / `data-unchecked`. **No ARIA to patch** — read out of `node_modules`, not
assumed: Tooltip needed it, Toast and Menu did not, and neither does this.
**The knob grows as it slides — 14px to 16px.** Figma draws it 14 in Input/Border when off and
16 in Input/Selected Foreground when on, so the insets are 2px at rest and 1px once flipped.
That is the file, not a rounding error, and it is built as drawn.
**It is positioned from one origin.** `left: 2px` in both states with the travel done by
`translate`, because `left` in one state and `right` in the other are different properties and
the browser cannot transition between them — the knob would jump. `top-1/2 -translate-y-1/2`
then recentres it for free as it grows, which lands both vertical insets without either number
appearing in the source. The travel is **11px**: a 30px padding box, less the 1px right inset,
less the 16px knob, less the 2px it starts at. Fifth component on the motion tokens —
`duration-fast-min` + `ease-standard` for everything that moves, because 11px of travel reads as
lag at anything longer.
**No `data-checked:hover:` guard is needed**, which was worth checking rather than assuming:
`hover:border-input-border-hover` and `data-checked:border-input-selected` have equal
specificity, so the winner is Tailwind's variant order, and it puts `data-*` after `hover`.
Hovering an on switch keeps the selected fill. Measured with the class stripped live in the
browser — the two stones are close enough that the wrong one would not have looked wrong.
**`invalid` goes past Figma** — its Switch `State` axis has no Invalid where Checkbox's and
Radio's do. Included so the three form controls carry one prop set, and wants adding to the
file: Divider's `emphasis` and SegmentedControl's `layout` again. It takes `data-invalid:` from a
surrounding Field too, alongside Checkbox and Radio — though Figma's Field does not list
Switch among the controls it wraps, so that pairing is one the code allows rather than one the
file asks for. Two ways in which this control's invalid state runs ahead of the drawing.
**`overflow-clip` not ported, for the fifth time** — the knob reaches nothing, and the shared
ring paints outside the track.
The row, card and label column are **a third copy** of Checkbox's recipes. Radio's note said a
third control was the point to extract them; that was reconsidered, because Figma keeps the
three as separate sets that can drift and a module spanning three folders would pin them
together in code while the file lets them move. **A fourth control is the point to extract it.**
**32×20 track, 14/16 knob, 40px card are the numbers to check.**
Left out: `readOnly`, which Base UI has and Figma draws no state for — it passes through the
spread unstyled rather than being a documented prop.
