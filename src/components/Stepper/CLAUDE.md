# Stepper

Where someone is in a sequence of steps: which are done, which one is current, what is still
ahead. Figma page `↪ Stepper` (`40004748:43528`), three sets in its Components section
(`40005494:63771`):

- `_Step Indicator` (`40006524:421`) — `Type` Auto | Number | Icon × `State` Complete | Current |
  Upcoming, plus Success | Warning | Error on Auto, and a `Number` text property.
- `Step` (`40006525:524`) — `Orientation` × `Layout` (Separated | On Track) × `Progress` × `State`
  (Default | Hover | Focus), with `Label Text`, `Description`, `Indicator`, `Leading Connector`,
  `Trailing Connector`, `Show Content` and the `Content` slot.
- `Stepper` (`40006526:681`) — the four layouts plus `Orientation=Horizontal, Layout=Compact`.

**The file went first** — drawn from Meta's Astryx Stepper, which is the reference Nathan brought —
and this is the code catching up, so every number below was read off those nodes. **No Base UI
primitive**: Base UI has no stepper, and the accessible shape is an `<ol>` with
`aria-current="step"`, Astryx's own model ("an ordered list, not a navigation landmark").

The API is Astryx's with three things derived, per the house rule:

```tsx
<Stepper activeStep={step} onStepClick={setStep} orientation="vertical" layout="on-track">
  <Stepper.Step label="Project details" description="Name it">
    {step === 0 && <Fields />}
  </Stepper.Step>
  <Stepper.Step label="Deploy" status="error" />
</Stepper>
```

## The decisions

**Progress is derived from `activeStep`, never passed per step.** A step before it is complete, after
it upcoming. Astryx is the same; a per-step `progress` prop could put two steps on "current".

**The index is the child's position, not a `step={n}` prop.** Astryx makes the caller number each
`<Step>`; here `Stepper` hands each direct child its index through context. A number that has to
agree with the child's position is a number that eventually will not. The cost: `Stepper.Step` has
to be a *direct* child (a fragment or a wrapper component hides it), and it throws if it is not.

**Clickable is derived from `onStepClick`.** Without it the steps are plain list items, nothing is
in the tab order and there is no hover. With it each step's `Target` is a `<button>` and gets
Figma's `State=Hover` (the Ghost button's wash, `Action/Ghost/Background Hover`, on the `button`
radius role) and `State=Focus` (`focusRing`). `onStepClick` *asks*; moving is the caller's call, so a
flow can refuse to skip ahead.

**The content slot is `children`, and Figma's `Show Content` is whether you passed any.** Vertical
only — a horizontal step is a fraction of a row with nowhere to put it, so children are ignored
there. It sits *outside* the target, so the hover wash and the button's name never include a form.
Separated content is indented 32 (8 + 16 + 8) so it lines up with the label; On Track content sits
beside a second length of rail, so the line between steps stays one line past it.

**`icon` makes the indicator `Type=Icon`; `indicator` is Auto | Number | None.** Figma's `Indicator`
boolean is `none`. Stepper-level `indicator` is the default and a step can override it — Astryx sets
it per step only, and every on-track example repeats `indicator="number"` five times.

**`status` is Success | Warning | Error, and it is the indicator's alone.** Figma models it as the
nested Indicator's `State`; here it is a prop on the step. It swaps the glyph and its
`Feedback/*/Highlight` color and is read out ("Identity document, error"), and never touches the
track. Astryx's `accent` is left out: the current step already is the accent.

**The Complete check is a bare Lucide `Check` at 10px, not an `Icon`.** Nathan's call in the file:
it is part of a drawn mark like the Current ring and dot, not a glyph anyone swaps, and 10px is not
one of Icon's four sizes. It still takes Icon's two stroke rules (`--icon-stroke-weight` through CSS,
`non-scaling-stroke`), so it paints the same 1.5px as every other icon. Status glyphs and `icon` are
`Icon` at the base 16, because those are full-size icons. Do not "fix" the check onto `Icon`.

**On hover, the unfilled grays step up to `Action/Secondary/Border`.** The ghost wash is neutral-800
at 10%, which lands within a shade of Stone 200 — the upcoming badge and the empty track vanished
into it. Stone 300 in light and 700 in dark reads on the wash in both themes; a white "cutout" was
the first idea and disappears in dark. Done with `group-hover/step:` off the button, so a read-only
stepper never changes. Figma carries the same override in its Hover variants.

**Connectors are square; separated bars are pills.** Two connectors meet at every step boundary, and
rounded ends notched the line there — it rendered as a dotted rail. Figma's connector `Line` has no
radius for that reason.

**The fill scales rather than swaps,** so advancing a step grows the line along the track it covered
— Astryx's motion, at `duration-medium` on `ease-standard`. Tailwind v4's `scale-*` sets the `scale`
property, so the transition names `scale`, not `transform`. Astryx only animates a one-step advance
and jumps otherwise; this animates every change, a simplification worth revisiting if a jump of three
steps looks busy. A screenshot taken just after a step change catches the fill mid-scale; read
`getComputedStyle(fill).scale` (`none` is full) rather than the picture.

## Compact is a container query, not a measurement

Astryx collapses a horizontal stepper once each step would get less than 112px (`minimumStepWidth`)
into a segmented track with the current step and Previous / Next under it — Figma's `Layout=Compact`.
Here that is a **container query on the stepper's own width**: no ResizeObserver, nothing to measure,
correct before hydration and in a hidden tab.

Three things it took:

1. **The threshold depends on the step count**, `116n − 4`, and Tailwind only generates classes it
   finds in the source. So `compact.ts` spells out one literal class per count (2–10), and
   `compact.test.ts` holds the table to the formula. Each class sets two custom properties,
   `--stepper-full: none` and `--stepper-compact: flex`, and every element that swaps reads one
   through `[display:var(…)]` — one class per count instead of one per element.
2. **The query goes on an inner frame, not the root.** A container query styles the container's
   descendants, never the container; on the root the classes compiled and matched nothing.
3. **The swapping target cannot also carry `flex`.** `.flex` beat `[display:var(--stepper-full,flex)]`
   in the cascade, so that one target spells its display through the variable alone.

Only horizontal + separated collapses, which is where Figma draws it. On Track has no Compact
drawing; its labels truncate instead. A vertical stepper never becomes a size container, because
`container-type: inline-size` would shrink one sitting in a hug-width row to nothing.

**While collapsed the step targets are `display: none`,** so they leave the tab order and the
Previous / Next buttons are the way to move. Each step keeps its name for assistive tech through an
sr-only span that is shown only when collapsed; the summary text is `aria-hidden` because the list
already says it, and the summary's description is "Step 3 of 5", as the file draws it.
`compactControls={false}` drops the buttons when the page has its own Back / Continue — Astryx's
`collapsedVariant: 'withLabel'`. Its `'hiddenLabel'` (a bare track) is not built.

## Accessibility

- `<ol aria-label="Progress">`, `aria-current="step"` on the current `<li>`. Not a `nav`.
- A clickable step's name is its label plus a status word — "Cart, completed", "Identity document,
  error" — via `aria-labelledby` on the label, and the description is `aria-describedby`. The
  computed name has a space before the comma (the sr-only span is absolutely positioned, so the
  name algorithm treats it as a block); the stories match with `/^Cart\W+completed$/`.
- Indicators, bars and rails are `aria-hidden`.
- **Hover is asserted from the stylesheet.** `userEvent.hover` cannot reach CSS `:hover` (Table's
  record), so `Status` reads the rules Tailwind emitted for the wash and the badge step-up.

## Left out

- Astryx's `isOptional` ("• Optional" after the label) — the file has no drawing for it.
- `minimumStepWidth` as a prop — 112 is fixed, and the threshold table is built from it.
- Disabled steps. Astryx has none either; a flow that cannot go back leaves out `onStepClick`.

## Best practices

Mirrored from the **Best practices** block on `↪ Stepper` (`40005494:63763`) in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Keep step labels short: "Payment," not "Enter your payment information."
- Use the vertical orientation when steps carry descriptions or content of their own.
- Show a step's content on the current step only, so the flow opens one step at a time.
- Below 112px a step, use Compact rather than squeezing the labels: a segmented track with the current step named under it. *(In code it collapses on its own.)*
- Set a step's Indicator to Success, Warning or Error to report a status. The track still shows progress. *(In code, `status`.)*
- Let people click back to a completed step when they may need to change an answer. *(In code, `onStepClick`.)*

**Don't**

- Use a stepper for fewer than 3 steps. A heading or a Progress Bar says it more simply.
- Use more than 7 steps. Group related steps or split the flow.
- Use it as navigation between unrelated pages. It is an ordered list of one flow, not a nav landmark.
