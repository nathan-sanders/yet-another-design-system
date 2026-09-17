# TextArea

More than one line of free text — a description, a comment, a message. Figma page `↪ Text Area`
(`40004748:43530`), component set `Text Area` (`40005234:609`): `Size` Default | Small | Large ×
`State` Default | Hover | Focus | Invalid | Disabled, plus the `Placeholder Text`, `Counter` and
`Counter Text` properties. The Field set (`40004051:15082`) gained `Type=Text Area`
(`40005236:36160`) in the same sitting.
**Code went first and the file caught up in the same sitting** — the ProgressBar route. The page
was one of the `(In Progress)` scaffolds: a header reading "Description goes here.", two blank
Preview frames, one "Usage rule." card per column, an empty Components section. Input's own record
had parked the component ("Base UI has no primitive and Figma draws no multi-line variant"), and
both halves of that sentence were still true when this was asked for with the node in hand.
**Built on Base UI's `Input`, which makes it the second component on that primitive rather than a
new one.** There is no Textarea in Base UI 1.7.0, but `Input` is literally `Field.Control` — one
line of JSX — and `Field.Control`'s keydown handler checks `event.currentTarget.tagName ===
'INPUT'` before treating Enter as a commit. A `<textarea>` via `render` is the case that check
exists for. Read in `node_modules`, not assumed. So a surrounding Field's label, description, error
and `data-invalid` all arrive for free, exactly as they do on Input.
**Input's box, borrowed.** `box` from `Input/styles.ts` is the outer element — NumberInput's and
Autocomplete's arrangement — so hover, the invalid border, the `has-[:disabled]` fade and
`focusRingWithin` are the same code as every other text field. `focusRingWithin` is right here for
the reason it is right on Input: exactly one focusable descendant. What is **not** borrowed is
Input's `control`: its `min-h-*` and the box's `items-center` are single-line assumptions. The
`textarea` recipe in this folder's `styles.ts` is the multi-line one.
**Height is `rows`, never `size`.** Astryx's rule, taken verbatim: the size changes the padding
and the type, `rows` (default 3, Astryx's; the native default is 2) sets the height. The box has
`min-h-6/8/10` from Input's recipe, harmless under any number of rows.

## The decisions

**The heights are Figma's 64 / 80 / 88, and the padding is the token minus one.** Figma draws
the inner padding as `spacing/0-5` / `spacing/1` / `spacing/2` with the stroke *inside* the
frame, so what the eye measures from the outer edge is 2 / 4 / 8 and what sits between stroke
and text is 1 / 3 / 7. Input ported that by keeping the box at Figma's outer height and letting
the content row be the box minus its two borders (30 in a 32 box). The same rule here puts the
textarea at `py-0.25` / `py-0.75` / `py-1.75` — real quarter-steps of the 4px scale, the way
Input's `min-h-5.5` is a half-step — so `rows={3}` comes out at 3×20+2+2 = 64, 3×24+6+2 = 80 and
3×24+14+2 = 88. The first cut used the token as-is and measured 66 / 82 / 90, two pixels over the
file at every size; **`AllVariants` and `Resize` assert the numbers** rather than trusting them.
**`resize` is `vertical` or `none`, default `vertical`.** Astryx's `resize: vertical`, read from
its rendered DOM: the person can pull the field taller, never wider, so a form column keeps its
width. `none` is for a fixed-height slot — a card, a dialog body — where a grip would let the
field push its neighbours around. Horizontal resizing is not offered; nothing in a form wants a
field wider than its label. The grip lives inside the `<textarea>` and the focus ring is a
`box-shadow` on the box, so the two never meet. Pulling the grip writes an inline `height` on the
textarea and the box, which hugs, follows it — measured at 162 for a 160px textarea, width
unchanged.
**`maxLength` shows a counter and does not stop typing.** Astryx's rule, and its reason: the
native attribute silently truncates a paste, and a person who pasted three paragraphs into a
280-character field needs to see that they did. So the prop is re-declared, never forwarded as the
attribute, and `WithCounter` asserts `maxlength` is absent. Past the limit the counter goes
`content-danger`, the box takes its invalid border through `box`'s `invalid` variant and the
textarea reports `aria-invalid`; deciding what to *do* about it belongs to the form that submits
the value, which does not exist yet — Field's record makes the same call about `validate`.
**The count is in user-perceived characters** — `Intl.Segmenter` at grapheme granularity, with
a code-point fallback. `String.length` would make "🇬🇧" four and a family emoji eight; Astryx
counts them as one, and so does the person typing.
**The counter needs the value, so the uncontrolled case is mirrored in state.** Slider's and
DatePicker's arrangement: `onValueChange` writes a local mirror when `value` is undefined, and the
mirror is only ever read to feed the counter. The controlled case reads `value` directly.
**The counter is an overlay in the box's corner, and the resize grip is why.** It shipped as a
row of its own under the text — `InputGroup`'s block-end slot, the layout doing the reserving —
and Nathan caught the grip a full line above the box's corner. The browser draws the grip inside
the `<textarea>` at *its* bottom-right, so anything in flow beneath the textarea pushes the grip
up with it, while Figma draws the grip at the box's corner with the count just left of it
(`40005236:36175`: count ends at x 268, grip spans 266–278, both on the bottom). The only way to
put the native grip there is for the textarea to reach the bottom of the box, so the counter is
`absolute right-2.75 bottom-0.75` — Astryx's arrangement — and the textarea reserves the strip
itself (`counter` variant: `pb-5.75` / `pb-6.75` / `pb-8.75`, the gap + 20 + the bottom padding,
each token minus the stroke). Measured against Figma's counter-on frame: box 104, count 12 from
the right and 4 from the bottom, textarea 1 from the bottom. `pointer-events-none` on the
count so a click on it still lands the caret.
**The counter is in `aria-describedby`, and Base UI keeps it there.** `LabelableProvider`'s
`getDescriptionProps` *appends* the Field's message ids to whatever `aria-describedby` arrives —
`Array.from(new Set([...external, ...messageIds]))` — rather than replacing it, so a Field's
description and this counter coexist; measured as `"41/80 | Keep it short"`. The prop is only
spread when set, because a forwarded `undefined` would delete what Base UI computed (the
Base-UI-clobbers-ARIA rule). It becomes `aria-live="polite"` **only while over the limit**:
announcing every keystroke is noise, the limit being crossed is the news, and going back under
falls silent again. Astryx keeps a permanent live region; this is the quieter reading of the same
intent.
**Every textarea attribute rides on the `render` element, and three ride on the primitive.**
Base UI's `Input` props are typed for an `<input>`, and `onClick`'s event target was the first
thing `tsc` rejected. So `{...props}` goes on `<textarea>` inside `render`, where it is typed for
a textarea, and Base UI's `useRenderElement` merges the element's props over its own, chains the
handlers and merges the ref. Three are pulled out and passed through the primitive instead,
because Base UI derives things from them: `id` (what a Field's label points `htmlFor` at — the
label resolved to the control's id when measured), `name` (what the Field registers for the form)
and `disabled` (what sets `data-disabled` on every part). Vite and Storybook do not type-check;
`npm run build` is what caught the first version.
**Not here, on purpose.** Input's `appearance="ghost"` — `box` has it for free, but Input's
record says a borderless field is only safe beside something identifying it, and a textarea has
no `InputGroup` to put an icon in. Astryx's `startIcon`, `isLoading`, `status`/`statusVariant`
and `disabledMessage`, for the reasons Input's record gives. `isReadOnly` is the native
`readOnly`, which passes through. An auto-growing height (`field-sizing: content`, shadcn's
newest) was parked here: neither Astryx nor the file has it for a form field, and the day a
design wants it, it is one utility class. **That day came with `ChatComposer`**, which is the
field that grows — it lives next door with its own record, and this one still does not.

## Drawing it in Figma

**The set is a clone of the Input set, reshaped** — `40004050:14183` cloned, moved into the
page's Components section, renamed. Cloning a set keeps every token binding on the frame
(`Input/Background`, `Input/Border`, `Input/Border Hover`, `Feedback/Danger/Highlight`,
`border-width/border`, the four `spacing/*` paddings, `border-radius/rounded-md`, and the 0.4
opacity on Disabled), so the reshape only touched what differs: the inner frame went VERTICAL
with its gap bound to the same variable as its vertical padding, the `_Input Value` instance
became a `Value` TEXT at FILL × a fixed three-line height (60 small / 72 above) carrying the
same bindings (`font/font-sans`, `text/base|sm/font-size` and `/line-height`, `Content/Subtle`,
Inter Italic), a hidden `Counter` row went under it, and a 12px `Resize Grip` of two 1px
`Content/Subtle` diagonals sits absolutely positioned in the corner. **The Focus Ring came across
in the clone**: Input's Focus variants already hold a `Focus Ring` instance (`40002012:954`,
STRETCH) inside the inner frame — the first read of that set missed it by only looking at the
Value instance — and it stretched to 80 / 88 / 64 on its own.
**`Placeholder Text`, `Counter` and `Counter Text` are set-level properties** wired to the Value
text's `characters`, the Counter row's `visible` and its text's `characters` in all fifteen
variants. All fifteen bindings were read back by variable *name* rather than trusted.
**The Field variant needed its property references rewired.** Cloning `Type=Input` and swapping
its nested instance for the Text Area produced a variant whose Label, Sub label and Validation
message texts had **empty** `componentPropertyReferences` — the refs belong to the set's
properties and do not survive a variant clone. Wired back by hand to `Label Text#40004051:359`,
`Sub Label#…360` / `Sub Label Text#…361` and `Validation Message#…362` / `…Text#…363`, and
read back. Worth knowing before cloning any other Field variant: **the clone looks complete
and is wired to nothing.**
**A filled value is an instance override in the preview, not a variant.** Input's `_Input Value`
carries a `Filled Text` axis; this set does not, because doubling fifteen variants to thirty for
one look was not worth it. The Docs preview's middle example overrides the `Value` text on its
instance to Inter Regular on `Content/Primary`. If a filled state is wanted on the canvas
regularly, that is the property to add.

## Testing

Six stories, all with play functions. `AllVariants` measures the three box heights and `rows`;
`Resize` measures `getComputedStyle().resize` and a six-row box (152); `WithCounter` asserts the
count in the accessible description alongside the Field's own description, the absence of
`maxlength`, `aria-invalid` past the limit, a live count after typing, and the grapheme count of a
flag; `States` asserts Field's error reaches the description. The focus ring was checked with a
real click in the browser rather than `element.focus()`, and dark mode with the box's 130ms
`transition-colors` finished first — a headless tab never advances the animation clock, and the
box read as white-on-dark until it was.

## Best practices

Mirrored from the **Best practices** block on `↪ Text Area` (`40005229:44428`) in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Use it for free text that runs past one line: a description, a comment, a message.
- Give it a name. A Field around it, or an aria-label where the surrounding context already says what it is for.
- Set a character limit when one exists. The counter shows the count as they type and turns red past the limit, without cutting anything off.
- Set the rows to the answer you expect. Three lines ask for a sentence or two; eight ask for the whole story.

**Don't**

- Do not use it for a single-line value like a name or an email. Input is the field for those.
- Do not explain the field in the placeholder. It disappears exactly when somebody needs to check what was asked.
- Do not rely on the counter to enforce a limit. It reports and warns; the form that submits the value decides.
- Do not turn off resizing unless the field sits in a fixed-height slot. Pulling a field taller is how people read back what they wrote.
