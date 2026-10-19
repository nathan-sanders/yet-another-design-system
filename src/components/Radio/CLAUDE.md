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
The dial, row, card and label column are the same shapes Checkbox draws, and since 2026-09-20
they are **imported from `Checkbox/styles.ts`** rather than copied. They were a deliberate copy
first — Figma keeps the sets separate and a shared module pins them together — and this record
said a third control would be the point to extract, then Switch said a fourth. Questionnaire's
answer row was the fourth, and Nathan called it. The one thing Radio's card does differently is
a variant there: `layout: 'row'`, the row laid flat with no slot under it (Figma's Radio *has* a
Slot; the code still leaves it out). Card is 40px, dial 20px — **the numbers to check**, and the
`InContainer` stories still measure them.
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
**And each option is named by its own text, said explicitly** since 2026-09-20: Base UI takes a
surrounding Field's label id ahead of an option's wrapping `<label>`, so under a Field every radio
was announced by the group's question rather than its own answer. The root now passes
`aria-labelledby` at its own label span and `aria-describedby` at its sub-label; the group is
still named by the Field. Found building `Form`; Checkbox and Switch carry the same fix.
Naming: Figma calls the property `Layout`, and the prop is `orientation`, after Divider's — the
library already spends `layout` on hug-or-fill in SegmentedControl and Tabs.

## Radio.Card

An option drawn as a card you pick, for when the options are things to look at — a chart type,
a report template — rather than lines to read. `<Radio.Card value>` inside a `Radio.Group`, with
free content, the way a Card's single `Content` slot is free. Built 2026-10-19 because Yet Social
had hand-rolled it twice (`FINDINGS.md` 40 and 103): `Radio.Root` rendered onto a `ClickableCard`
with `nativeButton`, once for the widget editor's Visualization tiles and once for New report's
type picker. A second copy is the bar.

**A part of Radio, not a `SelectableCard` component.** The two candidates were a card variant of
Radio and Astryx's `SelectableCard`. Everything that makes it work — one value, one tab stop,
arrows that move and select, the Field wiring — is `Radio.Group`'s, and a card outside a group
does nothing. So the honest shape is a second option part beside `Radio`, not a component with a
group of its own. A `variant="card"` on `Radio` was the other way to say that and is worse: Radio
takes `label` / `description` and draws a dial; the card takes children and draws none, so one
component would carry two incompatible prop sets. A card you tick on and off independently is a
checkbox, and nothing asks for one yet — if something does, it is `Checkbox.Card` by the same
argument.

**The drawing is Clickable Card's `State=Selected`, and since 2026-10-19 it is its own set.** When
this was built the file had no selectable card: only `Clickable Card` (`40004251:16237`) with
`State=Selected` on both emphases, and Social Media Management's `_Measure Viz Option`
(`40005872:24935`), whose own description says to drop it "into a Clickable Card slot" with Selected
marking the current chart. So the surface is that card's, driven by the radio: `radioCard` in
`Card/styles.ts` is `tv({ extend: clickableCard })` with the selected surface restated under
`data-checked:`, written beside the prop version so the two cannot drift. **No dial**: the file
draws none, and the first Yet Social tile with one was sent back for it. Emphasis and padding are
ClickableCard's props. `selected`, `href` and `render` are not, because the radio owns all three.

**Figma's `Radio Card` set (`40005966:25534`)** was then drawn from the code on `↪ Radio Group`,
below `Radio` in the Components section: `Emphasis` Default | Ghost × `State` Default | Hover |
Focus | Invalid | Disabled × `Selected State` Default | Selected, 20 variants cloned from Clickable
Card's so every binding came along, with a `Content` slot (`Content#40005966:0`) holding Clickable
Card's default Title and Description. Prop to property: `emphasis` is `Emphasis`, checked is
`Selected State`, and `State`'s Invalid and Disabled are what a Field or the group sets. Read back
per variant: Selected and Selected Hover are Surface/Background Subtle on Surface/Border Emphasized,
Invalid is Feedback/Danger/Highlight on either fill, Disabled is `opacity/opacity-40`. The Docs
frame gained a three-card row in both Preview themes (`40005966:75130` light, `40005966:75152`
dark), the header now points at Radio Cards, and Clickable Card's set description now names this
set where it used to say "a different component".

**Three states read Base UI's attributes rather than props**, which is the point of not wrapping
`ClickableCard`. `data-checked` is the selection. `data-disabled` is set on every card a disabled
`Radio.Group` or `Field` reaches, so one prop on the group greys them all — ClickableCard's
`disabled` is a per-card boolean and could not. `data-invalid` comes from a surrounding Field and
paints Radio's invalid edge, Feedback/Danger/Highlight, on the card's border. **Invalid beats
checked** (`data-checked:not-data-invalid:`), so a wrong answer that is also the chosen one keeps
its danger edge; the selection still shows as the subtle fill and `aria-checked`. Invalid is
code-first — Clickable Card draws no such state.

**Not `aria-current`.** The workaround inherited ClickableCard's `selected`, which sets
`aria-current` — "the one you are viewing" — on top of `aria-checked`. This sets only the latter;
the stories assert the former is absent.

**Named by its own content, said explicitly.** Base UI's `useAriaLabelledBy` prefers a
surrounding Field's label over everything but an explicit `aria-labelledby`, so in a Field every
card was announced as the Field's question — the bug Radio fixed on 2026-09-20, in a new shape.
The card points `aria-labelledby` at a `display: contents` span round its children (so they stay
the card's flex items). A caller's own `aria-labelledby` replaces it, and **a rich card should
pass one**: left alone, New report's card is named by its title, its sentence and its widget list
together, read on every arrow press. `WithDescription` shows the title as the name and the rest as
`aria-describedby`.

**It is a `<button>`** — Base UI's `nativeButton`, ClickableCard's element — so children are
phrasing content: spans, `Text render={<span />}`, icons. A `<div>` or a heading inside renders and
is invalid HTML. Base UI also swallows Enter on it: a radio activates on Space only.

**The layout is the caller's.** `Radio.Group` is a flex column; both callers pass a grid
(`grid grid-cols-3`), which `cn` merges over the flex. No `columns` prop until a third caller
wants the same grid.

**Numbers to check:** 8px radius, 1px border, 12px padding at `padding={3}`; the viz tile measured
123×66 in a 384px three-column grid. Checked: Surface/Background Subtle on Surface/Border
Emphasized, held under a real pointer hover; unchecked hover: Surface/Background Subtle on
Surface/Border. Disabled 0.4. The `Dark` story repeats the surface assertions in dark — after
finishing the cards' color transitions, which the theme switch starts and a read would land in the
middle of.

## Best practices

Mirrored from the **Best practices** block on `↪ Radio Group` (`40004242:15025`) in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Use it when exactly one answer is allowed and the options need room to be explained.
- Keep it to between two and seven options.
- Put the question, the description and the message on a Field above the group. Each option keeps its own label.
- Use Radio Cards when each option is something to look at, like a chart type or a report template. Keep sentences in a radio list.
- Give every card a short title. It is what a screen reader announces as the option; the rest of the card describes it.

**Don't**

- Do not run more than four options horizontally. They wrap awkwardly past that.
- Do not use a radio list where the options are short and sit beside a button. That is a Segmented Control.
- Do not offer a radio group somebody may want to answer with nothing. A radio cannot be unpicked once it is picked.
- Do not mix card sizes in one group. Keep the grid even, one card size per row.
