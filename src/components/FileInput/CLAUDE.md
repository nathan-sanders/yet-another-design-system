# FileInput

Choose a file, by browsing or by dropping it. Figma page `↪ File Input` (`40005777:34841`),
component set `File Input` (`40005780:52302`): `Mode` Input | Dropzone × `Value` Empty | Chosen ×
`State` Default | Hover | Focus | Invalid | Disabled, plus `Drag Over` on the dropzone — 22
variants — and the `Placeholder Text`, `File Name` and `Prompt Text` properties. The chosen-file
row is its own drawing part, `_File Input / File` (`40005780:371`), with `File Name` and `File
Size`. The Field set (`40004051:15082`) gained `Type=File Input` (`40005780:52623`) in the same
sitting. Astryx's `FileInput` is the reference.

**Code went first and the file was drawn from it the same day** — the ProgressBar and TextArea
route. The page was a scaffold: "Description goes here.", two blank Preview frames, one "Usage
rule." per column, an empty Components section, and an unfilled variant-table annotation above it.
So props were settled from Astryx and the platform, and every number on the canvas was taken from
the built component and measured: 32 for the field, 100 for the zone, 40 more per chosen file.

## The decisions

**The control is a real `<input type="file">`, visually hidden, and that is the main departure
from Astryx.** Astryx hides its input from assistive technology (`aria-hidden`, `tabindex="-1"`)
and lays a `<button aria-label={label}>` over the box — read from its rendered DOM. Here the native
input *is* the focusable control, kept in the accessibility tree with `sr-only`, so a screen reader
announces the browser's own file button with its name and the chosen file, Space and Enter open
the picker natively, and a `<form>` submits the files with no glue. A click anywhere on the box is
forwarded with `input.click()`, ignoring clicks that land on a button inside it.

**Built on Base UI's `Input` with `type="file"` on the render element** — TextArea's arrangement,
and the third component on that primitive. `Input` is `Field.Control`, and Field.Control only
forwards `value` when one is passed (read in `node_modules`, `field/control/FieldControl.js`), so a
file input is safe left uncontrolled under it. In exchange a `Field` labels it, describes it,
registers its `name` and marks it invalid exactly as it does an Input. `id`, `name` and `disabled`
go through the primitive; everything else rides on the render element (TextArea's split).
`aria-invalid` is spread only when set — a forwarded `undefined` deletes the one Base UI computes.

**One size, 32px.** Astryx has no `size`, and neither does the file. Input's three sizes were not
carried over: nobody has asked for a 24px file field, and a 24px box cannot hold the 24px clear
Button anyway. Add the axis when something needs it.

**`mode` is Astryx's word and Astryx's values.** `input` is `Input`'s `box` imported outright, with
an upload icon, the placeholder or the chosen names, and a ghost `small` Button to clear —
**small is measured, not preferred**: the row is 30px inside the borders, so a default 32px Button
cannot fit. `dropzone` is the same `box` reshaped by the `dropzone` recipe: `flex-col`, `border-
dashed`, padded `py-5.75 px-4`. Astryx pads it 24 / 16; Figma's stroke is inside the frame, so
TextArea's rule makes the vertical padding the token minus the border, and the zone measures
**100** in both — 23 + 20 icon + 8 + 24 text + 23 + 2. `AllVariants` asserts both heights.

**The box's ring is `ring="input"`, not `within`** — NumberInput's reason. In `input` mode the
clear button is a second focusable descendant, and `has-focus-visible` would ring the box for it
too. Scoping to `has-[input:focus-visible]` keeps one ring at a time.

**The files are always a `File[]`**, with at most one when `multiple` is off. Astryx switches
between `File` and `File[]` on `isMultiple`; one shape means a caller never narrows. `value` /
`onValueChange` for the controlled case; uncontrolled, the list is mirrored in state (TextArea's
counter arrangement).

**A new choice replaces the old one**, from the picker and from a drop alike — the native
semantics, and the only ones a picker can have. Each row under a dropzone has its own remove
button, and removing or clearing returns focus to the input (Astryx's rule).

**The native input always holds exactly the accepted files.** A drop, a removal or a rejection
writes `input.files` through a `DataTransfer` (the one way to build a `FileList`) and dispatches a
synthetic `change`, which React delivers to Base UI's Field.Control so its filled and dirty state
follow. A ref skips the component's own handler for that echo. The stories assert `input.files`
after every change, because a form submitting stale files would render perfectly.

**Rejections are reported, not displayed.** `accept`, `maxSize` and `maxFiles` screen every
candidate in that order — type, then size, then count — and anything turned away comes back
through `onFileReject` as `{ file, reason, message }`, the message written for a person
("contract.exe isn't an accepted file type."). Showing it is `Field`'s job, as every other
validation message in the library is: the caller sets the Field's `error` and clears it in
`onValueChange` (`Rejection` story). Astryx displays the error itself; here that would be a second
place messages live. `accept` matching is the native grammar — `.ext`, `type/*`, exact MIME —
because the picker's own filter can be overridden with "All files" and a drop has none.

**Sizes are decimal units through `Intl`** — `2.4 MB`, `184 kB` — which is what Finder and Explorer
show most people, localized for free. `formatFileSize` is exported because a caller writing a
`maxSize` sub label wants the same spelling.

**The drag state is `data-dragging`**, set by counting `dragenter`/`dragleave` (a boolean flickers
across children) and only for drags carrying `Files`. It paints the border `input-selected` and
the fill `action-ghost-background-hover`, the same 10% wash a ghost field hovers with — measured
against both tokens with a probe. Dropping onto `input` mode is not supported, matching Astryx.

**The pure half lives in `files.ts`** (`matchesAccept`, `screen`, `formatFileSize`,
`sameFiles`), pinned by `files.test.ts`, so the component file exports only a component for Fast
Refresh.

## Left out

Astryx's `isLoading` / `changeAction` (the upload belongs to the caller), `status` /
`statusVariant` (Field's message), `disabledMessage` (Button's record on Tooltip over disabled
controls; the guidance says to use the sub label), `labelTooltip`, `isRequired` / `isOptional`
and `isLabelHidden` (Field's, or an `aria-label` standalone), `width` (a `className`), and folder
upload, which is Astryx's own "don't". No new tokens.

## Traps found building it

- **Testing Library's `fireEvent.drop(el, { dataTransfer })` cannot carry files.** It rebuilds the
  `DataTransfer` by copying the given one's *own* properties, and a real one has none, so the
  handler saw an empty drag and the test read as a broken component. The stories dispatch a real
  `DragEvent` through a `drag()` helper instead — verified by hand in the browser first.
- **The headless Browser pane froze the dark-mode crossfade mid-way**, so a dark screenshot showed
  white boxes over correct computed colors. Load the story with `globals=theme:dark` and
  `finish()` the animations before trusting a picture.
- **Figma: `strokesIncludedInLayout` defaulted on for the new frames**, which made a 4 + 24 + 4 box
  measure 34. Text Area's box has it off; set it off on any frame whose stroke is inside.

## Best practices

Mirrored from the **Best practices** block on `↪ File Input` (Docs frame `40005777:34857`, columns
`40005777:34868` / `40005777:34870`) in Figma.

**Do**

- Set the accepted file types, so the picker only offers files that can be used.
- State the limits in the sub label (formats, size, how many) before anyone picks a file.
- Use the dropzone when files are the main task, and the compact field when a file is one answer
  among many.
- When a file is turned away, say which one and which limit it broke in the validation message.
- Let each chosen file be removed on its own.

**Don't**

- Don't hide the label. A file button with no name doesn't tell a screen reader user what to choose.
- Don't drop a rejected file silently. A file that vanishes without a message reads as a broken
  control.
- Don't use it to choose a folder; only files are supported.
- Don't wrap a disabled File Input in a Tooltip to explain why. Disabled controls never get the
  hover, so say it in the sub label.

In code: `accept`, the Field's `description`, `mode`, `onFileReject` into the Field's `error`, and
the per-row remove buttons the dropzone draws for you.
