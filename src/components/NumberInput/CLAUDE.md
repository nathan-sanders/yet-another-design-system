# NumberInput

A field that only takes numbers, with a − and a + flanking the value. Mirrors Figma nodes
`40005013:746` (Number Input, `Size` × `State`, plus `Steppers`, `Units`, `Scrub Handle` and
`Units Text`) and `40005008:416` (`_Number Stepper`, `Direction` × `Size` × `State`), both on the
page `↪ Number Input` (`40004748:43529`).
**Fifteenth Base UI component**, first on `number-field`; Field was the fourteenth. Base UI supplies
all seven parts — Root, Group, Increment, Decrement, Input, ScrubArea, ScrubAreaCursor — so the only
thing written here is chrome.
**Code first, then the file, on the same day.** Neither this nor OTPInput was on the roadmap and
neither had a Figma node; `Input`'s record had parked `type="number"` spinners with the line
"`NumberField` is its own component". Both halves shipped together, which is the Accordion route
rather than the BentoGrid one.
**It borrows Input's box rather than copying it** — `box`, `control`, `addonText` and `ICON_SIZE` all
come from `Input/styles.ts`, which is Autocomplete's arrangement. Same 24 / 32 / 40, same `px-3`,
same italic placeholder, same invalid border. Only the stepper recipe is new, and it lives inline.
**`NumberField.Group` is the box, not `Root`.** Root renders a bare `<div>` with no styling; Group is
what actually contains the input and the buttons, and it is what Base UI gives `role="group"`.
**The box has no padding at all, unlike Figma's Input.** The stepper cells are square at the box's
*inner* height — 22 / 30 / 38, the box minus its two 1px strokes — and sit flush against the ends,
so vertical padding would push the field past 24 / 32 / 40. The 12px lives on the value instead,
which is where the code has always had it (`control` is `px-3`, `box` has none). **In Figma that
meant a token rebind on the `Value` instance** rather than padding on the frame — Card's rule, and it
is `spacing/3` both sides, never a typed number.
**The alignment is derived, not declared.** With steppers the field is a quantity picker and the
value centers between the two buttons; without them it is an Input and reads left-aligned. That
follows from what you passed, so it is not a prop.
**`steppers` defaults to `true`, and the Figma boolean matches.** Astryx defaults its
`hasNumberSteppers` off; this does not, because the steppers are what make the component itself — a
NumberInput without them is an Input with a numeric keyboard, and Input is the component for that.
The default should show the thing being what it is.
**The focus ring is scoped to the `<input>`, and `Input/styles.ts` grew a `ring` variant to say so.**
`focusRingWithin` is `has-focus-visible:`, which does not care *which* descendant matched, and this
box has three. Combobox's tokenizer settled the same question the same way. It could not be done by
appending classes: `has-[input:focus-visible]:ring-2` and `has-focus-visible:ring-2` are different
variant prefixes, so tailwind-merge treats them as different keys and leaves **both** live, which
rings the box anyway. Only replacing works, so `ring: 'within' | 'input'` is a variant with `within`
as the default and Input, InputGroup and Autocomplete unchanged.
**Measured afterwards, and the finding is worth keeping: Base UI holds both steppers at
`tabindex="-1"`.** That is the standard spinbutton arrangement — the keyboard path to the value is
the input's own arrow keys — and a mouse press does not land focus on them either. So today
`within` and `input` paint identically, and the stepper's own `focusRing` never fires. Both stay:
they describe what *should* fire the ring rather than what currently happens to, and the raw
`NumberInput.Increment` is exported for people who will change exactly this.
**No divider between the stepper cell and the text**, unlike Astryx, whose stepper is a 16px column
flush at the trailing edge with a hairline on its left and another between the two chevrons. That is
a different drawing; none of its parts carry over. Here `InputGroup.Addon`'s precedent applies — no
divider, and the ghost hover wash is what gives the button its shape.
**The scrub grip is inside the field because Field owns the label.** Base UI's own demo wraps the
label in `ScrubArea`; that is not available here, and a grip is the more discoverable affordance
anyway — a label does not look draggable. The raw parts are re-attached for anyone who wants the
label version.
**`format` and `locale` are pass-through, and that is the whole feature.** Base UI already shows the
formatted value at rest and the raw number on focus, and exposes the formatted one through
`aria-valuetext`. Astryx models it as a `formatValue` callback; `Intl.NumberFormatOptions` is the
same idea in a vocabulary both sides share.
**`_Number Stepper` carries a `Direction` axis rather than an icon swap, and Figma forced that.**
`componentPropertyReferences` accepts only `characters`, `visible` and `mainComponent`, so the
nested Icon instance's own swap property cannot be bound to an outer one — `setProperties` on the
stepper instance answers *Could not find a component property with name*. Decrease and Increase are
a closed set of two, so an axis is honest; 2 × 3 × 3 = 18 variants for an underscored sub-part.
**Figma trap, twelfth time:** the Group frame arrives with `clipsContent: true`, which silently ate
the focus ring on all three Focus variants. Figma's overflow-clip is not ported and the ring paints
outside on purpose.
Left out: Astryx's `hasClear` (a second trailing affordance beside the increment is one control too
many), its `statusVariant`, and its `disabledMessage`. Base UI's `allowWheelScrub` and `snapOnStep`
are not surfaced separately — they arrive through the `Omit<…Root>` extend like everything else.
**`readOnly` is an undrawn state, and that is a standing debt shared with OTPInput.** It passes
through, and Base UI turns off the arrow keys, the wheel and both buttons on its own — which is
Astryx's rule too. But the library has no read-only *treatment* anywhere, and Input's own guidance
forbids faking one with `disabled`. Neither Figma set draws it. Whoever draws the first one should
draw all of them.
**Slider's debt is now unblocked but not paid.** Figma draws a 56×32 number input at the Slider's
trailing edge, two of them for `Type=Range`, behind a `Max Number Input` boolean. That is exactly
the default field height, and this is the component it was waiting for.

## Best practices

Mirrored from the **Best practices** block on `↪ Number Input` (`40005003:37744`) in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Use it for an exact number somebody may want to nudge: a quantity, a percentage, a headcount.
- Show the unit inside the field. A % or a GB belongs beside the number, not in the sub label.
- Set a min and a max. The steppers disable themselves at the bounds, which says where the limits are before anybody reaches one.

**Don't**

- Do not use it for a number that is really a code. A phone number, a card number or a year wants Input, and a code somebody was sent wants OTP Input.
- Do not switch the steppers off and leave nothing in their place. Without them this is an Input with a numeric keyboard, and Input is the component for that.
- Do not reach for it when the value is approximate. Slider is the control for a number chosen by feel.
