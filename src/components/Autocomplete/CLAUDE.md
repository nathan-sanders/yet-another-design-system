# Autocomplete

Free text, with suggestions that do not constrain it. Mirrors Figma nodes `40004146:6778`
(Autocomplete, `Size` × `State` × an `Icon` boolean, 15 variants), `40004146:6731`
(_Autocomplete Value, `Size` × `Filled Text`), `40004146:6981` (Autocomplete Menu Item, `State` ×
`Type` Default | **Avatar**, plus `Icon` and `Sub label` booleans), `40004147:7312` (Autocomplete
Menu Group) and `40004147:7345` (Autocomplete Menu).
API: `<Autocomplete items={…}>` + `Autocomplete.Item` / `Autocomplete.Group`.
**Twentieth Base UI component, the fifth that portals** after Tooltip, Menu, Select and Combobox,
and the last of the form family.
**The whole component is one rule removed from Combobox: a value that is not on the list is still
allowed.** Base UI puts that in the API rather than in a prop — `value` / `defaultValue` /
`onValueChange` are the input **string**, not a chosen item; `selectionMode` is `'none'` and
`selectedValue`, `isItemEqualToValue`, `itemToStringLabel`, `inputValue` and `fillInputOnItemPress`
are all `Omit`ed. Choosing a suggestion writes its label into the input, which is a shortcut for
typing rather than a commitment. Everything else about the two components follows from that.
**One shape, not two.** Combobox is a trigger in single select and a tokenizer in multi select;
this is neither. Figma draws it as an Input Group — a bordered field with a magnifier in the start
slot, **no chevron on any of the fifteen variants**, and no Clear. There is nothing to choose
between, so there is no shape axis.
**The field is `Input`'s box, imported not copied.** `box`, `addon`, `control` and `ICON_SIZE` from
`Input/styles.ts`, at the same 24 / 32 / 40 — and the geometry lands on Figma without adjustment:
`addon`'s `inline-start` `pl-3` puts the glyph 12px from the border, `control`'s `px-3` puts the
text 12px after it, which is Figma's `px-3` plus `gap-3`. Measured: 24 / 32 / 40 tall, icon 12px at
small and 16px above, glyph 12px in, text 41px from the border box at the default size.
**And `focusRingWithin` is right here where it was wrong for Combobox's tokenizer.** The rule is
one ring at a time, always on the thing that has focus — a container ring says nothing when the
container has several focusable children. `Autocomplete.InputGroup` has exactly one, the `<input>`,
so the box may light up for it. Measured: two strokes on the group, none on the input.
**`InputGroup` earns its place three times over.** It is the popup's anchor —
`resolvedAnchor = anchor ?? (inputInsidePopup ? triggerElement : inputGroupElement ?? inputElement)`
— so `--anchor-width` is the whole field's width with no `useRef`, which is exactly the problem
Combobox's tokenizer had to solve by hand. It takes a `mousedown` anywhere in the group down to the
caret. And it publishes `open` / `disabled` / `readOnly` / `listEmpty` as real `data-*`, though the
box's existing `has-[]` rules already cover what is styled.
**The popup half is *shared* with Combobox, not copied.** Base UI's `autocomplete` subpath
re-exports `Popup`, `Positioner`, `List`, `Group`, `GroupLabel`, `Collection`, `Empty`, `Row`,
`Portal`, `Icon`, `Clear` and `Input` as **the same component objects**, and Figma draws the two
menus identically. That is CLAUDE.md's test for sharing — not "do they look alike" but "is it the
same primitive underneath" — so those recipes moved to `Combobox/styles.ts`, the way ContextMenu
reaches Menu's rows through `Menu/styles.ts`. **Where the share stops is `Root`, `Item`, `Trigger`,
`Value` and `Separator`**, which are genuinely different components; the field recipes stay in
`Combobox.tsx` and `AutocompleteGroup` is written out again because its Separator is its own.
Verified by the Combobox story suite passing unchanged.
**No search header on the panel**, unlike the Combobox Menu, which draws a 48px Input Group in its
own. There the field is a trigger, so the search has to live somewhere; here the field *is* the
input. The file draws the difference and Base UI enforces it: put an `Input` under a `Positioner`
and `inputInsidePopup` flips the whole anatomy.
**A name on the popup is prohibited, with no exception.** The input is outside the panel, so Base
UI leaves it on `role="presentation"`, where `aria-label` is an axe `aria-prohibited-attr`
violation. Combobox spreads one only in its single-select shape because the same element is a real
dialog there; this component has no such shape, so the attribute is never written. Measured:
`role="presentation"`, no `aria-label`, no `aria-labelledby`.
**`Field` keeps its default `nativeLabel`.** The control is a real `<input>`, so clicking the label
should land the caret — the opposite of Select and of single-select Combobox, whose `<button>`
triggers would open on a label click. This is the third case that shows Field's two label questions
are independent.
**`Type=Avatar` is derived from the data, not asked for with a prop.** A row draws Figma's 20px
avatar because its `AutocompleteItemData` has one, the same way Avatar picks its own `Content` and
Breadcrumbs finds its current page. The type is deliberately narrower than `AvatarProps` — no
`href`, no `onClick`, no `size` — because the row is the hit target and the file draws one step
(`x-small`, 20px, measured). A prop that can contradict the data is a prop that will.
**A row has no `selected` state at all.** `AutocompleteItem`'s state is `{ disabled, highlighted }`,
so there is no `ItemIndicator`, no `indicatorBox`, no check and no radio — the entire third of
Combobox's item that exists to mark a chosen value. That is the same fact as "off-list values are
allowed", seen from the row's side.
**`openOnInputClick` and `autoHighlight` are both left at Base UI's `false`, deliberately.**
Clicking an empty search box should not fire a menu at you, and auto-highlighting the first match
nudges toward an on-list value, which is the one thing this control is not for. Both are exposed as
props.
**`appearance="ghost"` comes free from `Input`, and this is the case its note names** — a global
search entry that sits quieter than a form field. A borderless field has no 3:1 boundary under WCAG
1.4.11, so it leans on what is beside it; here the magnifier is what does that, which is why the
search case is the safe one for ghost and a bare ghost field is not.
**`Autocomplete.Empty` has no Figma counterpart and is not optional** — a filter that empties the
list without saying so looks broken, and here it is also the moment the point of the component
applies: what you typed is still a perfectly good answer. Recorded as a gap in the file, like
Combobox's and Select's scroll arrows.
**Base UI overloads `Root` on flat-versus-grouped `items`**, so a union of the two matches neither
overload even though the runtime takes both — it makes the same `'items' in items[0]` test the
component does. The cast picks the flat form.
**Measured, not assumed:** field 24 / 32 / 40; row 32px with its text 21px from the panel edge,
which is Select's and Menu's number; popup `rounded-lg` on the Medium elevation
(`0 8px 16px` at 25%); positioner `z-40` from `overlayLayer`; `role="combobox"` +
`aria-expanded` + `aria-controls` + `aria-autocomplete="list"` on the input, `role="listbox"` on the
list, `role="option"` on the rows. And the behavior itself: typed `sourdough starter`, blurred, and
the value stood.
**`overflow-clip` is not ported** — eleventh time. Figma sets it on the menu, the group's items
wrapper and the row; here it would slice the focus ring.
**No new tokens and no `generate.py` run** — `input-*`, `surface-*`, `surface-border`,
`content-*`, `feedback-danger-highlight` and `shadow-medium` all existed.
Left out: `Autocomplete.Trigger` and `Value` (no trigger, and the value is the input's own);
`Clear`, `Backdrop`, `Arrow`, `Row` and `Status`, none of which Figma draws; `grid`, `inline` and
virtualization; and `Autocomplete.Label`, because `Field` owns the label. `Clear` and `Status` are
re-attached as raw parts for a caller who needs them.

## Best practices

Mirrored from the **Best practices** block on `↪ Autocomplete` (`40004242:14664`) in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Reach for it when what somebody types is the answer and the suggestions only save keystrokes. A search box, a city, a tag they may be inventing.
- Always render the empty state. A filter that empties the list without saying so looks broken, and what they typed is still a good answer.
- Give it a name: a Field label, or an aria-label when it stands alone in a toolbar.

**Don't**

- Do not use it when the value has to come from the list. That is Combobox, and it is the only difference between the two.
- Do not auto-highlight the first suggestion. It nudges towards an on-list answer, which is the one thing this control is not for.
- Do not open the menu when somebody clicks an empty field. Suggestions are for working from, not an ambush.
