# Input / InputGroup

A single line of free text, and the same field with things attached to
it. Mirrors Figma nodes `40004050:14183` (Input, `Size` × `State`) and `40004051:14425`
(Input Group, which adds a Start Slot, an End Slot and a `Display` property). The component
Slider has been waiting on, and the reason its trailing number input was left unbuilt.
**Thirteenth Base UI component**, first on `Input`; Link was the twelfth.
**Base UI has no Input Group** — unlike almost everything else here, it is not in their list and
`/components/input-group` is a 404. That pattern is shadcn's; the `<input>` is still Base UI's.
**Neither of these owns its label.** Figma's Field set supplies it, and the Input and Input
Group sets have since had their own `Label` / `Sub Label` properties **removed** — along with
Select's, Autocomplete's and Combobox's, which carried the same vestigial pair. The label now
exists in exactly one component in the file, which is what makes the weight conflict noted under
**Field** unrepeatable rather than merely fixed. These two are the control and nothing else.
Standalone, an Input still needs a name — a Field around it, or an `aria-label`, which is the
toolbar-search shape.
**One folder, two components, sharing `styles.ts`** — Avatar's arrangement, not Checkbox's
duplication, because these two draw the same box at the same three sizes and Figma keeps them as
a pair rather than as sets that drift independently.
**`align` is per addon, and Figma's `Display` is not.** Figma switches both slots together, so an
icon beside the text *and* a row of actions underneath is not a variant it can draw. Unrolled
into `inline-start` / `inline-end` / `block-start` / `block-end`, as shadcn has it.
**The box is `flex-wrap`, not `flex-col`, and that is the whole trick.** Which layout the box
needs depends on props of its children, and a parent cannot read those. So a block addon is
`w-full` and takes a line to itself; inline addons share a line with the text; and an explicit
`order` scale (1 / 2 / 3 / 4 / 5) makes `align` authoritative no matter what order the children
are written in. `min-h-*` rather than `h-*` so the box can grow.
**The stacked heights are exactly three inline ones, and that falls out of the parts.** An addon
row is one box-height (its icon plus symmetrical padding); the text row is a box-height *minus
its two borders*, because the borders are on the box. **24 / 32 / 40 inline and 72 / 96 / 120
stacked are the numbers to check**, and the rows measure 24/22/24, 32/30/32 and 40/38/40, which
is Figma's own distribution. All measured.
`px-3` at **every** size, which is Figma — unlike Button's 8 / 12 / 16, and like
SegmentedControl's and Tabs' 12 / 12 / 12. Padding is on the control rather than on the box so
the whole field is a hit target: click anywhere in an empty one and the caret lands.
**Three things the box reads off its own descendants with `has-`, rather than taking as props.**
Focus is `focusRingWithin`, the Slider situation again — it lands on a descendant `<input>`, so
the ring goes on the box and the input draws none of its own. Validity is
`has-[[data-invalid]]:`, because inside a Field that state arrives on the control rather than
here (the `invalid` prop is the standalone path, and the two compose). Disabled is
`has-[:disabled]:`, and **keeping the fade on the box rather than on `Field.Root` is what stops
the two compounding to 16%** when a disabled Field wraps a disabled control — measured at a clean
0.4, not 0.16.
Focus is `ring-offset-2` + `ring-2` — a gap and a stroke, both painted outside the box —
rather than a real border change; the box measures pixel-identical focused and unfocused. And
unlike a `<button>`, an `<input>` matches `:focus-visible` on a **mouse click** too — verified
with a real click, because `element.focus()` does not trigger it at all and will tell you the
ring is broken when it is fine.
**The placeholder is italic.** Figma binds `text-base/italic regular`, not the regular face; it is
invisible in a screenshot and only shows up in the variable defs. Italic is this system's mark
for text the person did not enter — the validation message is italic for the same reason.
`InputGroup.Addon` takes `icon` as well as children, which is Button's `startIcon` idiom rather
than shadcn's: an addon holding arbitrary children cannot size an `<Icon>` for you, and Figma
wants 12px at small and 16px above it. Pass `icon={Search}` for the common case and children for
a Button or a chip. **No `InputGroup.Button`**, which shadcn has — it only presets two props, and
`<Button appearance="ghost" size="small">` already is the right thing. Switch's rule: a later
case is the point to extract it. **A Button in an addon is not disabled by a disabled Field** —
nothing reaches into arbitrary children, so the box fades and stops taking pointers but the
button keeps its place in the tab order unless you disable it too.
**No new tokens, and no `generate.py` run** — the `input-*` ramp already existed for Checkbox and
Radio. Also **no untokenised values**: the text row's 22 / 30 / 38 are `min-h-5.5` / `-7.5` /
`-9.5`, real half-steps of the 4px spacing scale rather than arbitrary pixels, so Avatar's
`tracking-[-0.02em]` and Link's `rounded-[0.4em]` are still the only two in the library.
**`Display` stays one property in Figma, settled deliberately.** The code can mix the two — an
icon inline while a row of actions sits underneath — and Figma's single property cannot express
that. The call was to leave the file documenting the two common cases rather than drawing four
`align` values it has no design for. Note this is the *reverse* of Badge's four hues, Divider's
`emphasis` and SegmentedControl's `layout`, where the code went past Figma and the file caught
up: here it deliberately does not, and the day a mixed layout is actually designed is the day
the property splits.
**`appearance="ghost"` goes past Figma**, the way Divider's `emphasis` and SegmentedControl's
`layout` did, and wants an `Appearance` axis adding to both sets. It is a field with no fill and no
stroke at rest, for a **global search entry** that should sit quieter than a form field: hovering
paints the same 10% wash Button's ghost uses, and focus brings the whole chrome back, so from the
moment you are typing it is indistinguishable from a default field. The border stays 1px and merely
turns transparent — Button's trick — so nothing resizes. Measured at 24 / 32 / 40 in both
appearances, with hover landing exactly on `action-ghost-background-hover`.
**The reason it is safe here and not everywhere.** A borderless box has no 3:1 boundary identifying
it as a control, which is WCAG 1.4.11's concern, so a ghost field leans on what sits beside it: a
leading icon in an `InputGroup`, a `Field` label, or the placeholder. That is Astryx's own condition
for hiding a search field's label, and it is why the search case is the safe case. The hover wash is
the third leg — it answers "is this interactive?" before you commit.
**Invalid stays visible at rest on a ghost field**, which is the one state that must not wait for a
hover. It works because `appearance` is declared *before* `invalid` in the recipe: tailwind-variants
applies variants in key order and tailwind-merge keeps the last of two conflicting border colours.
Verified in the browser, because that is a silent failure if the order ever flips.
Deliberately **not** enforced with a props union, unlike Button's icon-only `aria-label`: those
unions enforce an accessible *name*, and a placeholder is a visual affordance — requiring one would
nudge towards placeholder-as-label, which Astryx warns against in the same breath.
**`--surface-border-ghost` is still unused, and is not this.** It is `white` in light and `stone-700`
in dark, so it means "a border that disappears into a card", not "no border" — on the stone-100
canvas it would paint a visible white outline. Ghost uses a transparent border instead. That token is
still looking for its consumer, as `feedback-*` was before Banner.
**Select (19) does not get this for free.** It carries its own copy of the input chrome rather than
importing this folder's `box`, so a ghost Select means adding the variant there too — worth deciding
before a third copy appears.

**Story trap, Banner's:** the variant matrix is a grid, not a `<table>` — both of these are
`w-full` and would collapse to their longest word in an auto-layout cell.
Left out: `Textarea` (Base UI has no primitive and Figma draws no multi-line variant),
`type="number"` spinners (`NumberField` is its own component), and Astryx's `loading`, `clearable`
and `statusVariant` — none are in the file.
Figma has since caught up: the Input and Input Group sets' `Label` and `Sub Label` properties
are gone, so their frames are the box alone at 24 / 32 / 40 rather than 76 / 84 / 92, and match
what the code renders.
