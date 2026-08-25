# Select

Pick one value from a list too long to show all at once. Mirrors Figma nodes
`40004055:15159` (Select, `Size` x `State` x `Hug`, 30 variants), `40004055:15112` (_Select Value),
`40004067:19075` (Select Menu Item, `Type` Single | Multi x `State` x `Selected`),
`40004067:19193` (Select Menu Group) and `40004067:19226` (Select Menu).
Composed API: `<Select>` + `Select.Item` / `Select.Group`.
**Sixteenth Base UI component, and the third that portals** after Tooltip and Menu.
**It swallows the whole tree, not just Portal and Positioner.** Menu stops at `Menu.Popup`
because a menu's trigger can be any button; a Select's trigger is drawn in Figma and is always
the same box, so `Select` renders Root, Trigger, Value, Icon, Portal, Positioner, Popup and List,
and its children are the items. One level deeper than Menu, for a reason Menu does not have.
**The popup overlaps the trigger, macOS-style** — Base UI's `alignItemWithTrigger`, its default,
which puts the selected row's text exactly on the trigger's value text. Measured: trigger top 216,
selected row top 215, with 40 items. Figma draws the trigger and the menu side by side to document
them separately, not to specify a dropdown below. **That is also why the Select set has no `Open`
state** — in this mode an open trigger is covered by its own popup, so there is nothing to draw.
Base UI drops the mode itself for touch and when space is short.
**`multiple` turns it off automatically.** There is no single selected row to line up with the
trigger when several are chosen, and Base UI's own multi-select example sets it false. A caller
never passes it; measured falling back to 4px below the trigger.
**No ARIA to patch, unlike Tooltip** — `role="combobox"` + `aria-expanded` + `aria-haspopup` on the
trigger, `role="listbox"` on the List, `role="option"` + `aria-selected` on items, `role="group"` +
`aria-labelledby` on groups. Read in `node_modules` *and* measured. `Select.Root` uses `useField`,
so a Field labels it and marks it invalid with no wiring, and it renders its own hidden input.
**An explicit `undefined` clobbers Base UI's computed ARIA.** Forwarding `aria-label` to the trigger
as a plain attribute stripped the `aria-labelledby` off every Select inside a Field, because writing
the key at all overrides what the field context computed. Spread the attribute only when it is set.
Caught by the story suite, which is the bug axe is worth having for.
**Items take real DOM focus** — no `aria-activedescendant`, a roving `tabIndex` instead — so Figma's
Hover and Focus collapse to `data-highlighted:` plus the shared ring, exactly as in Menu.
**The trigger has no vertical padding, deliberately.** Figma's `padding-block` of 2/4/8 around a
20/24/24 line-height sums to 24/32/40 only because a Figma stroke does not add to a frame; a CSS
border does, and would give 34 at the default size. Letting the line-height centre in a `min-h` box
lands all three exactly — Input's fix. **24 / 32 / 40 are the numbers to check**, all measured.
**A flat list gets the group's padding implicitly.** Figma hangs the popup's 8px on the *group's*
items wrapper, because the header sits outside it — so an ungrouped list had its rows hard against
the border, measured at a 158px popup where Figma draws 174. `Select` wraps a groupless list in the
same `role="none"` padded div rather than making callers add a group for padding alone. Header text
and row text both land 21px from the popup edge, as in Menu.
**The placeholder is italic**, invisible in a screenshot and only in the variable defs — Input's
trap, and Field's validation message. **Item 32px, 52px with a sub-label; popup `rounded-lg` on
Elevation/Drop Shadow/Medium.** All measured.
**Scroll arrows are ours, not Figma's** — the cost of overlapping the trigger, since a long list has
to scroll inside a popup already sitting on its anchor. Built from tokens at 24px; a gap in the file
to be drawn, like Divider's `emphasis` and Menu's `destructive`.
**`Select.Value` renders the raw value unless Root is given `items`**, so `value="gala"` would put
"gala" in the trigger rather than "Gala". `Select` derives that list by walking its own children,
which keeps one source; passing `items` yourself skips it.
**Story trap, Menu's by a different route:** a closed select keeps its popup in the DOM but inside a
`hidden` subtree, and axe walks past anything hidden — so the run passes by checking nothing. `Open`,
`Groups` and `MultiSelect` start open on purpose.
**`Field` gained `nativeLabel`** for this: the trigger is a `<button>`, which is a labelable element,
so a real `<label for>` would open the popup on click and light the trigger on hover. Base UI ships
the switch and names `<Select.Trigger>` in its warning. Verified: the label focuses the trigger and
leaves it closed, and the name still resolves through `aria-labelledby`. Combobox and Autocomplete
will want the same.
**No new tokens and no `generate.py` run** — `input-*`, `surface-*` and
`feedback-danger-highlight` already existed. No third untokenised value.
Left out: `Backdrop` and `Arrow` (Figma draws neither), `Select.Label` (Field owns the label),
filtering (Base UI is explicit that Combobox is the answer), and Astryx's `hasClear`, `isLoading`,
`hasSelectAll` and `statusVariant`, none of which are in the file.
