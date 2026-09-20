# Questionnaire

An assistant that needs answers before it can go on, one question at a time: pick one of a few,
tick everything that applies, or type something the list did not anticipate, then Next. Composed
API: `<Questionnaire>` round `Questionnaire.Item`s, each holding `Questionnaire.Choice`s and an
optional `Questionnaire.Input`, with a `Questionnaire.Actions` footer.

Mirrors the Figma section "Questionnaire" (`40005494:63853`): the `Questionnaire` frame
(`40005494:64409`, 280 × 320 at rest), `Questionnaire Options` (`40005494:64349`, `Type` Single
Select | Multi Select), and the two row sets `Questionnaire Item Radio` (`40005494:64023`) and
`Questionnaire Item Checkbox` (`40005494:63972`), each `State` (Default | Hover | Focus |
Disabled) × `Selected`, with `Icon` and `Sub Label` booleans and a `Kbd` at the end. The control
inside each row is an instance of the library's own `Radio` (`40004007:4098`) or `Checkbox`
(`40004007:3962`), the field an instance of `Input` (`40004157:15970`), the key an instance of
`Kbd` (`40004073:20923`). **Measured back at 280 × 320, rows 40, field 40, dial 20, key 20**, with
8px between rows and 16 between the question, its answers and the footer. The Docs page is
`40005494:63838`, and the row sets carry `State=Invalid` and a `Shortcut` boolean since the day
after the build — see "The file caught up" below.

## The library's first form primitive that is not Base UI's

The behavior is **`@shadcn/react/questionnaire`** — `@shadcn/react@0.3.1`, MIT, one peer
dependency (`react >= 19`), no runtime dependencies, an `exports` map with two subpaths
(`questionnaire`, `message-scroller`) and no root. It is the headless primitive under shadcn's own
questionnaire, which is what Nathan pointed at.

Base UI was checked first and has the radio and the checkbox but not the step machine round them:
which question is open, whether it has been answered or skipped, validating one before moving on,
focusing the next, per-answer shortcuts, Enter to continue. That is the bar `@dnd-kit` cleared —
**check what the platform or the headless primitive already does before writing it** — and the
primitive does all of it on native `<form>`, `<fieldset>`, `<input type="radio|checkbox">`,
`<input type="text">` and `<button>` elements, renders nothing styled, and animates nothing. So it
is the engine, and every pixel here is ours, through `render` on each part.

Two consequences worth knowing:

- **The `render` merge is element-wins.** `render={<Button appearance="primary">Next</Button>}`
  gets the primitive's `type="submit"`, `hidden`, `inert`, `aria-hidden`, `aria-keyshortcuts` and
  `data-*` because Button's `type = 'button'` is a destructuring default, not something written on
  the element. **Never write `type` on a render element, and always write `children`** —
  `ButtonProps` requires it, so the navigation wrappers default `'Previous'`, `'Skip'`, `'Next'`
  and `'Submit'` themselves.
- **It reads `process.env.NODE_ENV` at runtime**, in a layout effect, which only exists in a
  browser because Vite's pre-bundling defines it. `vite.config.ts` names
  `@shadcn/react/questionnaire` in `optimizeDeps.include` for that reason as well as Toast's
  (only these stories import it, so the scanner would otherwise discover it mid-run and reload the
  page under the test). There is no library build to worry about externals in — `npm run build`
  is `tsc -b` plus the playground app, and `tsc -b` is the only step that sees this code.

## What the file draws, and what it became

| Figma | Code |
|---|---|
| `Questionnaire` frame, `flex-col gap-4` | `Questionnaire` — the `<form>`, `flex w-full min-w-0 flex-col gap-4 font-sans` |
| "Question" frame `gap-2`: `Number of Questions` · Span{`Question Text`, `Question Description`} | `Questionnaire.Item`'s header: Progress, then title and description with no gap |
| `Number of Questions` boolean | `progress` on the root, default on — and off regardless when there is one question, because "Question 1 of 1" is nothing to count |
| "Selections" `gap-2`: `Questionnaire Options` + `User Option Input` | the primitive's `Choices` as `flex flex-col gap-2`, holding the item's children |
| `Questionnaire Options` `Type` Single \| Multi Select | `multiple` on the item; the choices read it through context and draw a box instead of a dial |
| `User Option Input` | `Questionnaire.Input` — Input's `box` and `control`, at `large` |
| "Footer" `flex justify-end gap-2`, one primary Next | `Questionnaire.Actions` — `Form.Actions align="end"`, with Previous · Skip · Next · Submit by default |
| Row `State` Default \| Hover \| Focus \| Disabled × `Selected` | CSS states and the primitive's `data-checked` / `data-disabled` on the `<label>` |
| Row `Icon`, `Sub Label` | `icon`, `description` on the choice |
| Row `Kbd` instance | the primitive's `ChoiceShortcut`, rendered as `Kbd` |

## The title is a `<p>`, and the count sits inside the fieldset

The primitive's `Title` is a `<legend>` by default. It is rendered as a `<p>` here and the
fieldset is named with `aria-labelledby` — the primitive's own documented composition, the one its
Card and Dialog examples use — for two reasons. A legend is never a flex item: the browser draws
it in the fieldset's border, so the file's "Question 1 of 3" sitting 8px above the title *inside*
the same column cannot be drawn round one. And the ordinary home is a chat log, where a run of
headings would enter the page outline; Toast's title is a `<p>` for the same reason.

`Description` needs no wiring — the primitive registers it into the fieldset's `aria-describedby`,
and `Error` joins it while the question is invalid. **Measured: the open fieldset's accessible
name is the question**, and the closed ones are `hidden` and `inert`, which keeps Tab, the
accessibility tree and `FormData` honest at once.

Progress renders **nothing** rather than a hidden element when it is off or there is one question:
an empty `role="progressbar"` in the tree says something is loading.

## The row

`px-3 py-2 gap-3 rounded-md`, a 1px **inside** stroke on Surface/Border, no fill at rest. The
stroke is an `inset-ring`, not a border, for Radio and Checkbox `inContainer`'s reason — the file
draws the row 40px tall (24 of line-height plus 8 above and below) and a border would make it 42.
Selected swaps the ring to Surface/Border Emphasized; hover and focus are the same wash of
Surface/Background Subtle, both drawn in the file; disabled fades the whole row at
opacity/opacity-40. Invalid — not drawn — swaps the ring to Feedback/Danger/Highlight, the
library's invalid border everywhere else.

**The input is `sr-only` and the ring goes round the row** (`focusRingWithin`), never round the
input: one ring, on the thing you can see, Checkbox `inContainer`'s rule. The `States` story
compares the selected ring's color against the token by painting a probe element with the same
custom property and reading its computed `color` — the two go through one serializer, so the
strings match, and nothing has to regex a color out of `getComputedStyle`.

**Named by its own text, described by its own sub-label.** The wrapping `<label>` would otherwise
name the input with everything in the row run together, sub-label included; the input carries
`aria-labelledby` at its label span and `aria-describedby` at its description span, the fix Radio,
Checkbox and Switch took on 2026-09-20. Only spread when there is text to point at — an undefined
`aria-*` prop deletes what the primitive computed.

**The row, the dial and the box are the shared control shapes in `Checkbox/styles.ts`.** They
were copied here first — Radio's record said the row shapes were a deliberate copy in Checkbox,
Radio and Switch because Figma keeps them as separate sets that can drift, and that a fourth copy
was the point to extract. This was the fourth, Nathan called it, and the extraction landed the
same day. The card is `controlRow({ inContainer: true, layout: 'row', fill: false })`: Radio's
flat row, with no fill because the answers stack inside a bubble that is already the primary
surface. Its own additions are `group/row`, the selected ring on Surface/Border Emphasized, and
the focus wash. The dial and box are `radioDial` / `checkboxBox` with `stateFrom: 'row'` — the
state lives on the `<label>` here, where the primitive puts it, rather than on a Base UI root, so
the indicator looks up at the group; the shared module carries both spellings side by side.

Radio-or-checkbox is read from the item's `multiple` through context, not from the row's
`data-type`. The glyph inside the indicator is a different element either way (a dot span, a
Lucide `Check`), so the branch is JavaScript regardless.

## The shortcut is a `Kbd`

The primitive assigns `A`… or `1`… to each enabled answer in DOM order, puts it on the row and the
input as `data-shortcut`, and on the input as `aria-keyshortcuts`; its `ChoiceShortcut` is a span
that is already `aria-hidden` and `hidden` when there is no key. It is rendered here as the
library's `Kbd` through `render`, dropping the letter the primitive hands over as `children`
(`KbdProps` has none — the key is drawn from `keys`). `[hidden]` beats Kbd's `inline-flex` in
Tailwind's preflight, so nothing more is needed to hide it.

`shortcuts` defaults to `letters` because the file draws the key on every row; the primitive's own
default is off, and `none` maps to that. **A shortcut selects and never advances** — Enter is what
continues, Cmd/Ctrl+Enter continues from anywhere — and both pause while you type in the
free-text field. All measured in `Keyboard` and `Shortcuts`.

## The free-text field

`Questionnaire.Input` is Input's `box` and `control` round the primitive's `<input>`, at **`large`**
rather than Input's `default`. The file draws the field at `px-3 py-2` on 14/24, which is 40 — the
rows' own height — and Input's 32 would leave it 8px short of them. That is the kanban avatar's
case: a measured constraint, not a preference, and the one kind of reason for reaching past the
default. `ring: 'within'` is right here where NumberInput needed `input`: the box has exactly one
focusable descendant.

Three things the primitive does with it, all measured in `Freeform`: it keeps the field **out of
the form** (`form=""`, no `name`) until something is typed; in a single-select question typing
**unpicks the radio**, and in a `multiple` one the text joins the ticked boxes under the same name;
and it puts `data-invalid` on the input, so the box lights up on a failed Next through its own
`has-[[data-invalid]]` rule with nothing added.

`aria-label` is required in the type, ChatComposer's rule: the field has no visible label and a
placeholder is not one. There is no default placeholder; "Describe another option..." is the mock's
copy and the caller says it.

## The description is Content/Subtle — since the day after it shipped

The file first bound the question's description to `Content/Primary`, one step darker than every
other sub-label in the library (Field's description, a Radio's, a Choice's here are all
`Content/Subtle`), and the code shipped with the file's value and the record flagging it. Nathan
settled it on 2026-09-20 by moving the Figma node (`40005494:64172`) to `Content/Subtle`, and the
code followed the same day: `text-content-subtle`, measured back as the same computed color as the
"Question 1 of 3" line above it. **Both sides agree**, and the general shape is the Pink precedent —
a token question settled at source, then mirrored, rather than a code override.

## Answers

`onAnswers` reads the form's `FormData` once every question has validated: one string per
question, an array for a `multiple` one, and a skipped question **absent** rather than `''` — the
primitive strips the `name` off a skipped question's controls and off an empty free-text field, so
they never reach `FormData`. `FormData` cannot tell one ticked box from one picked radio, so the
component reads the names whose controls are checkboxes off the form's own elements and hands the
set to `readAnswers` in `answers.ts`, a pure function with a node test. It prevents the native
submit, since a chat answers in place; the native `onSubmit` still fires first, for a caller that
wants the event.

`items` is the primitive's opt-in: pass the same array the parts are mapped from and, in
development, it checks the rendered questions and choices against it and warns on a mismatch.
The stories omit it except `Controlled`, and the check is silent there.

## No ring on the fieldset

The primitive moves focus to the newly opened `<fieldset>` (it is `tabindex="-1"`), and a
programmatic focus after a keypress does match `:focus-visible` in Chromium. There is deliberately
no ring drawn there. A ring round a whole question — its title, every row and the message — is the
container-ring problem TreeList solved by not doing it; the newly revealed question is the signal,
and the next Tab lands on the first answer with a ring of its own, which `Keyboard` measures.
shadcn's styled version makes the same call. Figma does not draw the state either way.

## The recap

`Questionnaire.Recap` is the questionnaire answered — Figma's `Questionnaire Recap`
(`40005537:65099`), which Nathan drew and proposed the day after the questionnaire shipped: a
Card at `padding={3}` holding one pair per question, the question `text-sm` on Content/Subtle
over the answer `text-sm` on Content/Primary, pairs `spacing/2` apart and nothing between the
two lines. It inverts the questionnaire's weighting because here the answer is the news.

**It replaces the questionnaire in the assistant's bubble** once `onAnswers` fires — Nathan's
call, over landing in the person's sent turn — so the log keeps the answers and not a dead form,
and a Card is never asked to sit inside an emphasized bubble. `InContext` does exactly that.

It is a `<dl>`: a question is a `<dt>` and its answer a `<dd>`, which is what a screen reader
reads them as, and the stories query them by `term` and `definition`. The words come from
`recapAnswers` in `answers.ts`, pure and node-tested beside `readAnswers`: a value becomes its
choice's label, free text prints as typed, a `multiple` answer's labels are joined with commas,
a `disabled` question is left out, and **a skipped question stays as a line** saying "Skipped"
in italic Subtle (`skippedLabel` to change the word) — a recap that drops a question reads as if
it was never asked. Not drawn in the file; the code went first there. **No edit action**, on
purpose: changing an answer is a new turn, not a button on the record of the last one.

The same `items` array feeds both halves, which is the point of the definition type: an agent's
questions come in once, are mapped into `Item`s, and are mapped again into the recap with the
answers beside them.

## Stories

Fourteen. `Playground` is the mock at 280 and measures the geometry; `Recap` and
`RecapSkippedAndFreeText` are the answered form's two shapes; `MultiSelect`, `Freeform`,
`Skip`, `Shortcuts`, `WithIconsAndDescriptions` and `States` each take one axis; `Keyboard` is the
contract above step by step; `Submit` is the record `onAnswers` receives; `Controlled` is
`item`/`onItemChange` with `items`; `FocusRing` is real Tab presses, because a scripted `focus()`
never matches `:focus-visible`; `InContext` is the assistant's turn — `ThoughtProcess`, then a
received `ChatMessage layout="fill"` whose ghost bubble is `w-full` and holds the questionnaire,
then the recap taking the form's place in the same bubble on Submit, on the primary surface,
Chat's rule.

Two traps met writing them: every closed question carries the same hidden message, so a page-wide
`getByText` for it finds three — scope to the open fieldset; and a shortcut is read by the form,
so a keypress with focus on `<body>` reaches nothing — put focus inside first, on the fieldset,
where the primitive itself puts it.

## The file caught up the same day

Everything the code built ahead of the drawing was drawn on 2026-09-20, the ProgressBar and
Carousel route, and the code did not move when it landed — the test of a real catch-up:

- **`State=Invalid` on both row sets** (`40005525:541` / `:568` on the Radio set, `:579` / `:591`
  on the Checkbox set), a fifth column on each variant grid. The stroke is `Feedback/Danger/
  Highlight`; the control inside takes its own `State=Invalid` on the unselected row, and keeps
  its selected disc on the selected one, because neither Radio nor Checkbox draws an
  invalid-and-selected control — their records say the CSS covers that gap, and the row's ring
  carries the state alone, which is exactly what `data-invalid:` on the card does here.
- **`Shortcut`** boolean on both sets, bound to every variant's Kbd — the row with no key. A
  number key is the Kbd's own text on the instance, as the last example on the Docs page shows.
- **`Error` / `Error Text`** on the `Questionnaire` component: Field's validation voice
  (`text-sm/italic regular`, `Content/Danger`) after Selections, off by default so the component
  still measures 280 × 320.
- **`Previous`, `Skip`, `Next`, `Submit`** booleans on the component, one Button each in the footer
  in that order — Secondary, Ghost, Primary, Primary — with Next the only one on by default.
- The one-question form with no count was never owed: `Number of Questions` was there from the
  start.
- **A `↪ Questionnaire` Docs page** (`40005494:63838`): the header sentence, three examples in
  Light and Dark — the mock, an invalid multi-select mid-flow, a last question with number keys
  and Submit — with the answered recap under them, and the Best practices block below, mirrored
  into it.

Two things the build found, both about the API rather than the component. **A variant's
`clone()` lands on the page, not in its set**, so `componentPropertyReferences` cannot be set on
it ("Could not find a component property") until `set.appendChild(clone)` — the clone that
reads as a sibling in the layers panel is not one yet. And the row sets' property keys
(`Icon#40004067:398`…) are shared between the Radio and Checkbox sets, because one was cloned
from the other; a key found by prefix on either set works on both.

## Best practices

Mirrored from the **Best practices** block on `↪ Questionnaire` (`40005494:63845`) in Figma.
The two are one text in two places — change one and change the other. Where a rule names a
thing, the canvas says the design word and this record says the prop beside it.

**Do**

- Ask one thing per question, and keep it to between two and seven answers.
- Use multi select (`multiple`) when more than one answer can be true at once. The rows become
  boxes and the answer becomes a list.
- Add the free-text field only where "something else" is a real answer, and give it a label
  (`aria-label`) that says what an answer typed there is.
- Leave a question optional (`required` off) when it may honestly go unanswered. That is what
  gives it a Skip.
- Put it in the assistant's own turn, filling the message (`layout="fill"`), so the answers read
  as part of the conversation.
- Once it is answered, put the recap (`Questionnaire.Recap`) where the form was, in the same
  turn. The log keeps the answers, not a dead form.

**Don't**

- Do not use it for one question with no follow-up. That is a Radio or a Checkbox under a Field,
  and it does not need a footer.
- Do not turn shortcuts off where a keyboard is expected. They are the fastest way through, and
  they never advance on their own.
- Do not put a second form inside it, or it inside another form. The root is the form.
- Do not read the answers off the rows. The submitted answers (`onAnswers`) already have them,
  lists and all.
