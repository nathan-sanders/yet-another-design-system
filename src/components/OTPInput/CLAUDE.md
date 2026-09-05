# OTPInput

A row of single-character boxes for a code somebody was just sent. Mirrors Figma nodes
`40005016:477` (OTP Input, `Size` × `Length`) and `40005016:410` (`_OTP Slot`, `Size` × `State`,
18 variants), both on the page `↪ OTP Input` (`40004748:43531`).
**Sixteenth Base UI component**, first on `otp-field`; NumberInput was the fifteenth. Three parts:
Root, Input and Separator.
**Code first, then the file, on the same day** — same route as NumberInput, and for the same reason:
neither was on the roadmap and neither had a node.
**Each slot is a copy of Input's chrome, not a share of it, and the line is worth stating.** `box` is
`w-full flex-wrap` with the focus ring baked in as `focusRingWithin`; a 32px square slot wants none
of that. The sharing rule is "is it the same primitive underneath", not "does it look alike" — same
tokens, different shape, so it duplicates, correctly. Compare NumberInput, which does import `box`.
**The slot is square at the field's own height** — 24 / 32 / 40 — so a row lines up with an Input
beside it. Most systems draw an OTP slot wider than it is tall; that would put a fourth width into a
library that has three. The gap is `spacing/2` (8px), measured at 40 / 32 / 48 pitch.
**The ring goes on the slot, never on the row.** Six focusable `<input>`s share one component, so
this is Combobox's tokenizer rule seen from the other end: the thing that has focus draws the ring
and the container draws nothing. Verified in a real browser — Tab rings the slot, the row's own
`box-shadow` stays `none`.
**`data-filled` is per slot, and that is Base UI being deliberate.** `OTPFieldInputState` **omits and
redefines** `filled` and `value` from the root's state so they mean *this* box, and adds `index`.
That is what lets a filled slot take the hover border with nothing passed down.
**Standing alone, the name has to arrive as `aria-labelledby`, and Base UI enforces that.**
`OTPField.Input` reads `aria-label` and then throws it away on index 0 — literally
`index === 0 ? undefined : slotAriaLabel`, with a dev-only warning pointing you at `<label>` or
`<Field.Label>`. So passing one produced **six unnamed inputs and an axe failure**, not an error;
the story suite caught it. `aria-label` is accepted anyway and turned into an `aria-labelledby`
pointing at a visually hidden span, because a library where one control silently refuses the prop
every other control takes is worse than one that adapts. `sr-only` is `position: absolute`, so the
span is not a flex item and does not eat one of the row's gaps.
**Base UI's own demo contains the `undefined`-clobbers-ARIA bug**, and copying it down would have
imported it: `aria-label={index === 0 ? undefined : …}` writes the key with an undefined value, which
overrides the `aria-labelledby` computed from the Field context rather than deferring to it. Spread
the object instead. Select's bug, one index at a time.
**`nativeLabel` stays `true`, verified rather than assumed.** Base UI derives slot ids from the
root's (`{id}-2`, `{id}-3`, …), so `Field.Label`'s `htmlFor` has exactly one place to point.
Measured in a real browser: `htmlFor` resolves to the first `<input>` and clicking the label lands
the caret there.
**`length` is passed twice, and that is Base UI's design.** The Root needs it to clamp a pasted
value and to know when the code is complete before any slot has hydrated; the slots themselves are
one `OTPField.Input` per box. The map lives here rather than in every caller.
**Base UI's `Separator` is `@base-ui/react/separator`** — the same component object the library
already wraps as `Divider`. It is re-attached as `OTPInput.Separator` for a caller who wants
`123-456` chunking, but there is no `groups` prop: plain gapped slots are the component.
**Figma cannot express `length` as a number** — its four property kinds are VARIANT, BOOLEAN, TEXT
and INSTANCE_SWAP, none of them numeric, which is Card's `padding` again. So the file draws
`Length` as a **string** variant axis with 4 and 6, the two counts anybody sends, and the code keeps
a real number.
**`_OTP Slot` is where the states live**, not the row: `Default`, `Hover`, `Focus`, `Filled`,
`Invalid`, `Disabled`. Hover and Filled are drawn identically, on purpose — both are
`Input/Border Hover` in the code, and the file should not invent a difference to look busier.
**Every slot's character stays `Content/Primary`, including Invalid** — only the border goes red.
Checked by reading the bound token off all eighteen variants rather than off a screenshot, where the
digit beside a red border reads as red and is not.
Left out: a `groups` prop, a `separator` prop, and any per-slot API. `mask`, `validationType`,
`autoSubmit`, `normalizeValue`, `onValueInvalid` and the rest arrive through the `Omit<…Root>`
extend.
**`readOnly` is undrawn here too** — the same standing debt NumberInput records. It passes through
and Base UI stops the editing; nothing in the library says what read-only looks like.

## Best practices

Mirrored from the **Best practices** block on `↪ OTP Input` (`40005003:37825`) in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Use it for a short code that arrived out of band: two-factor sign-in, email verification, a device pairing code.
- Let people paste. A pasted code fills every box at once, which is how most codes actually get entered.
- Draw as many boxes as the code you send has characters. The length is what tells the field the code is complete.

**Don't**

- Do not use it for anything typed from memory. A password or an account number belongs in an Input, where it can be corrected as one string.
- Do not let the boxes be the only thing naming the field. The label names it, and it reaches the first box only.
- Do not stretch it past a code somebody can hold in their head. Past eight boxes the row stops reading as one value.
