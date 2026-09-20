# Form

The `<form>` a set of Fields sits in, and the thing that decides *when* their values are checked
and what happens when they are submitted. Base UI's `Form` under a 16px column, with two layout
parts beside it: `Form.Row` for fields that pair up, and `Form.Actions` for the button row.
**Twenty-second Base UI component.**

Built on 2026-09-20. The Field record had said since the day it shipped that deciding when a value
is wrong "belongs to a Form component that does not exist yet", and the stories had been paying
for it: twelve story files hand-rolled `flex justify-end gap-2` for a button row, Panel and Drawer
bodies stacked Fields at `gap-4` by hand, Field's own `InContext` was a raw `<form>` with
`preventDefault`, and nothing anywhere validated or submitted. Card's rule — the file draws
nothing, but something has been reinvented in the component's absence — met on every count.

## Figma

Page **`↪ Form`** — there was no page at all, not even an `(In Progress)` scaffold, so this went
the ProgressBar route: built from Base UI's `Form` and Astryx's `FormLayout`, then drawn into the
file from the built component in the same sitting.

| Thing | Node | Became |
|---|---|---|
| Docs frame (header, Light + Dark preview, 5 Do / 4 Don't) | see below | this record's Best practices |
| `Form` component, `Fields` slot over a `Form Actions` instance | see below | `Form` |
| `Form Row`, two FILL Fields at `spacing/4` | see below | `Form.Row` |
| `Form Actions` (`Align` End \| Start \| Stretch) | see below | `Form.Actions`, its `align` prop |

_Node ids are filled in by the Figma step of the same PR; if this table still says "see below",
the page is owed._

**What Astryx says, measured rather than read.** `FormLayout`'s vertical direction is a flex
column at **16px**; its horizontal direction is an equal-column grid, also at 16. Its third,
`horizontal-labels` (labels beside inputs, CSS grid, collapsing at 480), is not built — nothing
in the file draws a label beside a control, and Field's own layout is the label above.

## Decisions

**`name` goes on the Field, not the control.** Every Base UI control resolves
`name = fieldName ?? nameProp` — Checkbox, Radio Group, Select, Switch, and `Field.Control` under
Input — and `Field.Root` takes a control's own `name` back through registration, so for a single
control either place works. `CheckboxGroup` does not: it registers with the form only when the
*Field* is named (`CheckboxGroup.js`: `useRegisterFieldControl(…, !!fieldName && !disabled,
fieldName)`), and the checkboxes inside a group never register themselves. So a `Checkbox.Group`
in an unnamed Field is invisible to `onFormSubmit`, `errors` and `validate()` — no error, no
warning, just a missing key. One rule covers every case, and it is the one in the Best practices.

**Inside a named Field a grouped Checkbox carries `value`, not `name`.** The line after the one
above: `value = valueProp ?? name`, and `name` is now the Field's. `<Checkbox name="email">` under
`<Field name="interests">` becomes `name="interests" value="interests"`, and so does every other
option — the group collapses to one value with nothing to say so. The `OnFormSubmit` story is
the one that would catch a regression; it submits `interests: ['email', 'sms']` and checks the
array. The Checkbox record's "matched by `name`" line now says where that stops being true.

**`noValidate`, and where the message comes from.** Base UI's `Form` renders `<form noValidate>`,
so the browser's bubbles never appear; on submit it asks every registered Field to validate,
focuses the first invalid control (`controlRef`, in DOM order), and only if none failed calls
`onSubmit` / `onFormSubmit`. The words under the field are then Field's, and they come from one of
three places: the browser's `validationMessage` for a native constraint (`required`, `type`,
`pattern`, `min`…), the string a Field's `validate` returned, or the Form's `errors` entry for
that Field's `name`. Field's `error` prop is the fourth — a message decided somewhere else
entirely — and it is the only one that was showing before this component existed.

**Field now renders `Field.Error` always, and had to change to do it.** It used to render the part
only when handed a string, so every one of the three sources above would mark the control
`data-invalid` and say nothing. The fix is one conditional spread, `{...(error != null && { match:
true, children: error })}`, and the shape matters: Base UI's `mergeProps` assigns every own key of
the props it is given, so JSX's `<Field.Error>{error}</Field.Error>` with `error` undefined would
put a `children: undefined` on the element and erase the message Base UI had computed. The
Field record has the rest.

**`errors` is watched by reference.** `Form.js` copies the prop into state through
`useValueChanged`, and a Field clears its own entry on change by writing that state. A fresh
`errors={{}}` literal on every render is a new reference every render, so it re-applies and undoes
the clearing after each keystroke. Hold it in state; the `ServerErrors` story shows the shape.

**`validationMode` is the form's default and the Field's override.** `onSubmit` (the default)
checks nothing until the first attempt, then follows each field as it changes; `onBlur` checks a
field when it is left; `onChange` on every change. A Field's own `validationMode` beats the form's,
which is how `Validate` runs Confirm password on change inside a form that is otherwise `onBlur`.
The rule for choosing is Base UI's and Astryx's both: do not check on every keystroke by default —
a person being told they are wrong while still typing is the classic form annoyance — and reach
for `onBlur` on a long form where a mistake at the top should not wait for the button at the
bottom.

**16px between fields.** Astryx's `FormLayout`, measured at the DOM rather than read from its
docs, and what Panel's and Drawer's bodies were already doing with `gap-4`. Field's own `gap-2`
is inside a field; this is between them. The `InContext` story asserts the form's `rowGap` inside
a Card whose own gap is 8, to show the two do not fight.

**`Form.Row` is `sm:`, not `md:`.** 768 is the shell's nav swap — ResponsiveNav, AppShell and Panel
all turn there — while *content* re-flows at 640: Card's story grids and AlertDialog's footer row
are both `sm:`. A pair of names in a 384-wide Drawer on a desktop is still two columns, which is
right; two columns on a 393 phone is not. No container queries exist in the library yet, and this
is not the place to introduce them.

**`Form.Actions` is the button row, and it earned its build.** `end` is the default and the exact
string twelve stories had hand-rolled. `start` is for a form that reads left to right with
nothing to its right. `stretch` is the sign-in shape — every button the width of the form,
stacked — and it is `flex-col-reverse` so the *last* child, the primary, lands on top while the
caller keeps the Cancel-then-Submit order the other two use; AlertDialog's footer already
reverses for the same reason. It does **not** stack on phones by default: every row it replaces
sits in a 384-wide surface where two buttons fit, and a form that wants the stack says
`align="stretch"`.

**The submit button has to say so.** `Button` defaults to `type="button"`, on purpose, so a Button
inside a form does not submit it by accident. The one that should submit is `type="submit"`, and
that is also what makes Enter in any field submit the form. `type="reset"` works too, with
`noValidate` making no difference to it.

**`FormHandle`, not `FormActions`.** Base UI calls the `actionsRef` type `Form.Actions`; here that
name is the button row. The imperative handle — `validate(fieldName?)` — is exported as
`FormHandle`, so nobody has to guess which `Actions` they are holding.

**The generic survives the wrapper.** Base UI's `Form` is a generic call signature rather than a
`forwardRef` component, so `ComponentPropsWithRef<typeof FormPrimitive>` compiles and quietly
drops the `Values` parameter. `FormProps<Values>` extends `FormPrimitive.Props<Values>` — which
already carries `ref` — and the wrapper is a generic function that renders
`<FormPrimitive<Values>>` explicitly.

**No `styles.ts`.** Three small recipes nothing else imports, so they sit inline the way Field's
do. The day Dialog's, Drawer's and Panel's footers migrate to `Form.Actions` is the day the row
recipe moves to a `styles.ts`.

## The naming bug this found

**A control inside a Field was being named by the Field, and its own label was lost.** Base UI's
`useAriaLabelledBy` resolves `explicit ?? labelId ?? fallback`, where `labelId` is the surrounding
`Field.Label` and `fallback` is the wrapping `<label>` — so inside `<Field label="Send me">`, both
boxes in a `Checkbox.Group` were announced as "Send me", and a lone Switch under a Field called
"Security" lost "Two-factor authentication". The `OnFormSubmit` play could not find a checkbox
called "SMS", which is how it surfaced. The Field record's stated intent — "a legend over a set,
not a second name for one box" — had never been measured.

The fix went into Checkbox, Radio and Switch rather than here: each now passes `aria-labelledby`
pointing at its own label span and `aria-describedby` at its sub-label, explicitly and only when
the text exists (an undefined `aria-*` prop deletes what Base UI computed). Explicit comes first
in the precedence, and the Field's sub-label and message still arrive, because Base UI's
`getDescriptionProps` *appends* to an existing `aria-describedby` rather than replacing it. The
group is still named by the Field, which is the legend. Every play in those three story files
still passes, and the full suite with axe at `error`.

## Traps

- **Every story submits, so every story needs `onFormSubmit`** (or `onSubmit` with
  `preventDefault`). A `<form>` with no handler navigates on submit — a GET with a query string —
  and in the test runner the page it navigates is the suite's.
- **Chromium's messages are locale strings.** Assert with regexes (`/fill out this field/i`,
  `/@/`, `/match the requested format/i`, `/check this box/i`, `/url/i`), not exact text.
- **`minLength` / `maxLength` only count text a person typed.** The browser's `tooShort` and
  `tooLong` need the dirty flag a real keystroke sets, and `userEvent.type` sets the value
  programmatically, so a play cannot trip them. `NativeValidation` uses `type="url"` instead and
  says why.
- **`valueMissing` is held back until the field is dirty.** Base UI suppresses it on a pristine
  field, so a blur with nothing typed says nothing; type a character and delete it first. Submit
  marks every field dirty on its own.
- **A Select's `required` sits on its hidden text input**, so its message is "fill out this
  field" and the first-invalid focus lands on the trigger through `controlRef`. No special case.
- **The Combobox submits its serialized value** (`'us'`), not the item object.

## Measurements to check if this changes

- Form `rowGap` 16; Row `columnGap` 16 with `gridAutoFlow: column` above 640 and `row` below; Actions
  `columnGap` 8, `justifyContent` `flex-end` / `flex-start`, `flexDirection` `column-reverse` for
  `stretch`.
- `novalidate` on the `<form>`; after an empty submit, `document.activeElement` is the first
  invalid control and its message is in its `aria-describedby`.
- `onFormSubmit` receives `{ name: string, role: string, seats: number, interests: string[],
  plan: string, newsletter: boolean }` for the `OnFormSubmit` fixture.

## Left out

- **A required indicator.** Figma's Field set has none; Astryx's `defaultOptionality` is a Field
  concern and the file has not asked for it.
- **`Fieldset`.** Base UI ships one, with a `Legend`. Nothing in the file draws a titled group of
  fields, and a Field over a Checkbox or Radio Group already gives a group its name. Decided with
  Nathan; the day a "Shipping address" section appears, it is the 23rd Base UI component.
- **Horizontal labels.** Astryx's third direction. Field draws the label above, and so does every
  form in the file.
- **`Form.Title` / `Form.Description`.** A heading is the caller's, Popover's reasoning — the
  `InContext` story shows the shape.
- **`useActionState` / server functions.** Base UI supports `action`, and so does this, untouched.
  There is no story for it because the library has no server to submit to.

## Best practices

Mirrored from the **Best practices** block on `↪ Form` in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Put every control in a Field, and put `name` on the Field, so the form can find the field that failed.
- Let the browser check what it can — required, email, a pattern — and keep `validate` for the rules it cannot.
- Show server errors through `errors`, keyed by the field's `name`. They clear on their own when the person edits that field.
- Put the Submit button in Form Actions and make it `type="submit"`, so Enter in any field submits.
- Pair fields in a Row only when they belong together — first and last name, city and state.

**Don't**

- Do not validate on every keystroke by default. The form checks on submit and only then follows the field as it changes.
- Do not put unrelated fields side by side. A Row reads as one question.
- Do not disable Submit until the form is valid. Submit, and let the first invalid field take focus.
- Do not wrap a single control in a Form just to get a message. Field's `error` does that on its own.
