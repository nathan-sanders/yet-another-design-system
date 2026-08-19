# Combobox

Pick from a list too long to scroll, by typing to filter it. Mirrors Figma nodes
`40004057:15715` (Combobox, `Select Type` × `Size` × `State`, 30 variants), `40004057:15668`
(_Single Select Combobox Value), `40004057:15991` (_Multi Select Combobox Value),
`40004113:14002` (Combobox Menu Item, `Type` Single Select | Multi Select | **Radio** × `State` ×
`Selected`), `40004113:14469` (Combobox Menu Group) and `40004113:14494` (Combobox Menu).
API: `<Combobox items={…}>` + `Combobox.Item` / `Combobox.Group`.
**Seventeenth Base UI component, and the fourth that portals** after Tooltip, Menu and Select.
**One Figma set, two components inside.** Single select is Base UI's **input-inside-popup**
pattern: the field is a trigger — Select's box with a chevron — and the search input lives in the
popup's header, which is exactly what the Combobox Menu draws. Multi select is its **Chips**
pattern, which is Astryx's Tokenizer: no trigger, no chevron, the field *is* the input, and the
chosen values sit in front of the caret as `Token`s.
**The tell is where Figma puts the placeholder.** In the multi-select value it sits *after* the
tokens, not in front of them — that is a caret, not a value slot. The set also draws no chevron on
any of its six multi-select variants, which is the same fact from the other side. Reading it the
other way would mean two search boxes on one control, and a token's remove button nested inside a
`<button>` trigger, which is neither valid nor operable.
**Base UI works this out for itself.** `Combobox.Input` sets `inputInsidePopup` when it has a
`Positioner` above it, which turns the trigger into `role="combobox"` + `aria-haspopup="dialog"` +
`tabIndex 0` and the popup into `role="dialog"`. Nothing here asks for it; putting the input in the
popup *is* the request.
**Items come from `items`, not from children — the one place this diverges from `Select`.** Base UI
derives `filteredItems` from `items` on the Root, so rows written as `Combobox.Item` children are
never filtered. Select's `collectItems` walk is deliberately not copied: it would produce a combobox
whose search silently matches nothing. A function child renders one row and is called with an item
in both the flat and the grouped case — the group wrapper is this component's business.
**No ARIA to patch.** Trigger `role="combobox"` / `aria-expanded` / `aria-haspopup="dialog"` /
`aria-controls`; popup `role="dialog"` when the input is inside it and `role="presentation"` when it
is not; `role="listbox"` + `aria-multiselectable` on the list, `role="option"` + `aria-selected` on
rows, `role="toolbar"` on the chips. All measured in the browser, not assumed.
**A name on the popup is required in one shape and forbidden in the other.** As a dialog it needs
one — Base UI's own example uses the placeholder, the only text this component reliably has. As
`role="presentation"` the same attribute is an axe `aria-prohibited-attr` violation. Spread it only
when `!multiple`. **Caught by the story suite**, which is the class of bug axe is worth having for.
**`Field` and `nativeLabel` split on the shape.** Base UI registers the trigger as the field control
when the input is in the popup and the input otherwise, so single select wants `nativeLabel={false}`
(the trigger is a `<button>`, and a real `<label for>` would open the popup on click) and multi
select wants the default `true` — its control is an `<input>`, and clicking the label should land
the caret. Verified: `<label for>` points at the caret's id, `aria-labelledby` at the label's.
**The tokenizer's box is Input's `box` written out again, for one reason: the ring.** Input's box
rings on any focusable descendant, which is right when the only one is the `<input>`. A tokenizer
has more — the arrow keys walk the chips, and Base UI gives each real DOM focus. Left on
`focusRingWithin`, the field lit up identically whichever chip you were on: the one thing you
already knew and none of the thing you needed. Measured, then fixed by scoping the box's ring to
`has-[input:focus-visible]` and giving the chip its own `focusRing`. **One ring at a time, always on
the thing that has focus** — the rule kept rather than bent, at ten duplicated classes.
**24 / 32 / 40 are the numbers to check**, in both shapes, and the tokenizer holds them with tokens
in it: measured 20 / 24 / 24 inside an inner box of 22 / 30 / 38, which is the arithmetic written
down in Token's own record. The field may only grow when the tokens **wrap**. The caret's
`min-w-16` is what decides when that happens — smaller and the field wraps with room plainly left,
larger and it wraps too eagerly. 64px was measured against a 320px field.
**The chips are `Token`s driven by Base UI**, the shape Token was built for:
`<Combobox.Chip render={<Token />}>` merges onto the pill and
`<Combobox.ChipRemove render={<Token.Remove />} />` takes the `x` over. It goes in Token's
**`endSlot`**, because Token's own `onRemove` would draw a second button. That is also why **Token
gained an `interactive` prop**: it derives `Usage=Interactive` from having a handler, and here the
handler is Base UI's, one level out of sight. Measured, the remove target is still 28×24.
`Combobox.Chip` is a `<div>` at `tabIndex={-1}` inside a `role="toolbar"`, so the chips are **one**
tab stop between them, not one each.
**The popup's search row has no box of its own** — the header's variable defs bind no
`Input/Border` and no `Input/Background` at all, only the rule beneath. Geometry is Figma's and
measured: header 48 + 1px rule, magnifier 20px from the panel edge, text 12px after it, rows 32px
with their text 21px in, exactly as in Select and Menu.
**And it draws no focus ring** — the one place this library's "every focusable thing takes
`focusRing`" rule is deliberately set aside. Base UI moves focus there the instant the popup opens,
so a ring would be permanent chrome rather than a signal, and there is nothing else in the panel for
focus to have come from.
**The tokenizer's panel is anchored to the box, not to the caret.** With no trigger, Base UI anchors
to the `<input>` — which is only the strip left over after the tokens, so the panel drifted right
and narrowed as values were added. Pointing `anchor` at the field puts it under the whole control
and makes `--anchor-width` the field's width, which is what Figma draws.
**The popup needed a `z-index`, and so did the other three.** Portalling to `<body>` last does not
settle painting order — a positive `z-index` anywhere on the page beats a popup left on `auto` — so
the `x` on every Token in the fields *below* an open Combobox floated over its menu. `Token.Remove`
is `relative z-10` and has to be. Fixed for all four portalled components at once through
`overlayLayer` in `src/lib/layers.ts`; the reasoning, and why 40 rather than 50, is written there.
**No scroll arrows, unlike Select.** They were the cost of overlapping the trigger; this hangs 4px
below its anchor, so the list simply scrolls inside the panel. Base UI ships none for Combobox
either.
**`Combobox.Empty` has no Figma counterpart and is not optional** — a filter that empties the list
without saying so looks broken. Built from the same tokens as the rows, announced through Base UI's
polite live region, and recorded as a gap in the file like Select's scroll arrows and Divider's
`emphasis`.
**Figma's item `Type` is three but the Combobox's is two**, so `indicator` is a prop: `check` is the
trailing 16px tick, `radio` a leading 20px circle with an 8px dot, and `multiple` always draws its
own leading 20px square with a 14px tick. A prop rather than a derivation because, unlike
`multiple`, nothing in the values says which one you want.
**`overflow-clip` is not ported** — ninth time.
**No new tokens and no `generate.py` run** — `input-*`, `surface-card-*`, `surface-border`,
`feedback-danger-highlight` and `shadow-medium` all existed.
Left out: `Combobox.Clear`, `Backdrop`, `Arrow` and `Row`; virtualization; `Combobox.Label` (Field
owns the label); a `Hug` property, which this set does not have though Select's does; and Astryx's
`maxEntries`, `hasCreate`, `status`, `+N more` overflow, `endContent`, `isLabelHidden` and
`disabledMessage`, none of which are in the file. Astryx's rule against colouring individual tokens
is already Token's.
