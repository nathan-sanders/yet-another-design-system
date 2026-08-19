# Token

One discrete piece of data as a small pill — a tag, an active filter, a chosen recipient.
Mirrors Figma node `40004003:3431` (Token, `Usage` View Only | Interactive × `State` Default |
Hover | Focus | Disabled × `Size` Default | Small, 12 variants).
API: `<Token>` + `Token.Remove` + `Token.Avatar`.
**Not a Base UI component — the first built for one that does not exist yet.** Base UI ships no
Token; what it ships is `Combobox.Chips` / `Chip` / `ChipRemove`, which are behaviour with no
look. So this is the look, shaped to be driven by them later:
`<Combobox.Chip render={<Token />}>` merges onto the root, and `Token.Remove` is exported
separately so `<Combobox.ChipRemove render={<Token.Remove />} />` can take it over.
**Not a Badge.** The two draw a similar pill and the line is what the thing *is*: a Badge is a
status you read, one of 18 Decorative hues, no states at all; a Token is a value someone chose,
in the card colour, that they can usually take back. Coloured and static → Badge. That is why
Astryx's 11 colours are **not** ported: they would make the two indistinguishable.
**20 and 24 are the numbers to check.** Measured, both sizes, view-only and removable. Same
12/20 type at both — Figma's `Size` changes the height and nothing else.
**Small is where Figma's stroke lies.** Figma's small variant is exactly one 20px line box with
a stroke that adds nothing to the frame; a CSS border adds, so `min-h-5` + `border` +
line-height 20 renders **22**. Select's padding-block trap arriving from the opposite direction.
The line box gives up the 2px: `small` sets `leading-4.5` (18px), keeps the 12px type, 18 + 2 = 20.
The default size already has 2px of block padding to absorb it and needs nothing.
**Why 20 and 24 are load-bearing beyond this component.** A Combobox shows tokens inside the same
bordered box Input, InputGroup and Select draw, and adding one must not change the field's height:
it may only grow when tokens wrap. The field's *inner* height is its box minus two borders:
**22 / 30 / 38**, against **20 / 24 / 24** — and all six measured true when Combobox landed.
A 22px small token would fill a small field edge to edge, which is what the `leading-4.5` fix buys. Input's `box` is already `flex-wrap` with
`min-h-*`, so the wrap case needs nothing from it.
**The end slot is the one thing that can break that**, because it is caller content. A small
token has 18px of content box and a Badge is 20px tall by its own spec, so a Badge in a small
token makes it 22. Figma agrees — the small variant's End Slot Items holds a 12px icon, not a
Badge. Recorded in the `Slots` story rather than enforced: capping it would break Badge's own
contract.
**Figma's `Usage` axis is not a prop.** A token is interactive because it has `onRemove`,
`onClick` or `href`, the way Avatar derives `Content` and Button derives icon-only. Hover is the
whole of what `Interactive` buys: Figma's Hover state adds `Elevation/Drop Shadow/Low` and
changes nothing else. `State` is not a prop either — except `disabled`, because a `<span>` has no
attribute to read it off, unlike Input's box.
**Except that `interactive` now *is* a prop, as an escape hatch.** Combobox's chips are
`<Combobox.Chip render={<Token />}>` with `<Combobox.ChipRemove render={<Token.Remove />} />` handed
in through `endSlot` — so the button is real, but the *handler* is Base UI's and lives a level out
of sight, the derivation could not see it, and the pill lost its hover. The rule the library keeps
is "derive where the value already says it"; here the value does not say it. The prop can only turn
the hover on, never off: a token with a real handler is interactive whatever it says.
**A clickable token is a span with an invisible button stretched across it**, never a `<button>`:
a removable one would nest a button in a button. Astryx hits the same wall and answers it the
same way; done for *every* clickable token, not only removable ones, so there is one code path
and one focus idiom. The overlay takes its name from the label by `aria-labelledby`, so the label
stays a `ReactNode` instead of becoming a required string prop.
**Two radii, and the second is a nesting rule.** `md` (8px) is a token standing on its own — the
radius every card and field in the library uses. `sm` (6px) is a token **inside** a field, which is
what `Combobox` passes for its chips: two curves of the same radius on different centres never read
as parallel, and subtracting the gap between them (8 − 3) lands almost exactly on the 6 the scale
already has. A prop, not a derivation, because a token cannot see what it is sitting in — and one
nothing but Combobox should ever pass.
**`Token.Remove` and the click overlay follow it, and `Token.Remove` reads it off context**, because
it is rendered by `Combobox.ChipRemove` as often as by Token itself. Both reach over the pill's
border, so their outer corners land exactly on its; a mismatch shows as a sliver of hover wash
outside the curve.
**Code first here — Figma binds `border-radius/rounded-md` on the Token instances inside its Multi
Select Combobox Value**, so the file wants the 6px drawing in. Divider's `emphasis` and Badge's four
extra hues went the same way round.
**Two stacking bugs, both found by measuring.** `inset-0` positions against the *padding* box, so
the overlay stopped 1px short all round and the border was not clickable — `-inset-px` puts it on
the border box. And a positioned element only paints over *static* siblings: `Avatar`'s root is
`relative`, so clicking a token's avatar did nothing while clicking its label worked. The overlay
is `z-1`, `Token.Remove` is `z-10`, above both.
**And `z-10` reaches further than it looks.** A positive z-index beats every positioned element left
on `auto`, wherever it sits in the document — so the crosses on a row of tokens punched straight
through an open Combobox menu portalled to `<body>`. The token is not wrong; the popups were, and
they now take `overlayLayer` from `src/lib/layers.ts`. Worth knowing before this number changes.
**Focus: the shared ring on the root, via `focusRingWithin`.** Figma draws it around the whole
token and both focusable things live inside, so neither draws one of its own — the
two-rings-on-one-control case, answered as Input and Checkbox `inContainer` answer it. The
consequence to know: a token that is both clickable *and* removable has two tab stops lighting
the same ring, so `Token.Remove` gets its own `action-ghost-background-hover` wash to tell them
apart — at `rounded-md`, the token's own radius, since the button reaches over the border and its
outer corners sit exactly on the pill's. Goes past the file, which draws no state on the `x`; wants adding there, like
Divider's `emphasis`.
**The remove target is 28×24 (28×20 at small), and the drawn geometry did not move.** Figma
draws a bare 12×12 `x` — a 12px target, well under WCAG 2.5.8's 24×24. Fixed the way Input fixed
its own: padding on the control, not the box. `-mx-2` cancels the token's trailing padding and
the flex gap, `px-2` re-spends both, and `-my-px` with `self-stretch` reaches over the 1px
borders. Measured: icon still 12×12, still 8px from the label and 9px from the outer edge.
**Avatar gained a numeric `size` for this.** Figma puts a 16px avatar in the default token and a
12px one in the small token; neither is a size Avatar has, and neither is in the Figma Avatar set
— they are resized instances on the canvas. `Token.Avatar` reads the token's size from context
and applies 16 or 12, so a call site never writes the number. See Avatar's own `CLAUDE.md` for
why the derived scales snap to the nearest named step.
**No new tokens and no `generate.py` run** — `surface-card-primary`, `surface-border`,
`content-primary`, `shadow-low` and the motion pair already existed. Every Figma value maps.
Left out: Astryx's `color` (Badge's job), `isLabelHidden` (Astryx argues against it in the same
breath), and `description` / `aria-description` (no Figma counterpart, thin support).
**Naming:** `src/components/Token/` is this component; `tokens/` at the repo root is the design
token export from Figma. Unrelated, and the collision is worth a second's care when reading a path.
