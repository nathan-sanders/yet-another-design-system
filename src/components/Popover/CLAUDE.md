# Popover

A click-triggered panel anchored to a button or a link. Mirrors Figma node
`40004379:42395` on the `↪ Popover` page (`40004379:42274`), which has **no variant set** and
exactly one component property — a SLOT called `Content` — so, like Tooltip, there is not a single
`tv()` variant here and everything interesting is behavior.
**Fifth Base UI component that portals**, after Tooltip, Menu, Select and Combobox, and the first
in the library to carry `role="dialog"`. Compound API: `<Popover>` + `Trigger` + `Popup` +
`Title` / `Description` / `Close`.
**`Popover.Popup` swallows Portal and Positioner** — Menu's move, and the reason `side`, `align`,
`sideOffset` and `alignOffset` are props on it rather than a nesting the caller writes out.

**The three sources disagree, and that is the design.** Figma draws a bare surface with no title
and no close button; Astryx documents a **required** Header (title, optional subheader, close) and
Body; Base UI supplies the dialog semantics. Astryx is the one that is right, and the file is the
one that is behind — so `Title`, `Description` and `Close` are built here ahead of it, the
Accordion route.

**Figma's own drawing cannot ship as it stands, and it is not a matter of taste.** Base UI names
the dialog from `Popover.Title` via `aria-labelledby`; with no Title and no `aria-label` it has no
accessible name, which is an axe `aria-dialog-name` violation at `test: 'error'` — and the file's
Docs previews are exactly that shape, a titleless popover holding a media block. **Measured, not
assumed:** deleting `label` from the `Anatomy` story fails the suite with that rule by name. So
`label` on the popup is what makes the file's own example shippable, and a real Title is better
than both, because it names the dialog *and* shows the name to everybody.

**The positioning defaults are read off the canvas, not inherited.** Both Docs previews agree: the
panel's top sits **8px** below its trigger's bottom and their **left edges are flush**, under a
102×32 Button and again under a 128×24 Link. Hence `side="bottom"`, `align="start"`,
`sideOffset={8}` — *not* Menu's 4 and *not* Base UI's `center`. Confirmed in the browser at 8 and 0.
The 8 is right for a second reason the canvas cannot show: `shadow-medium` is `0 8px 16px`, so a
4px gap would drop the panel's own shadow onto its trigger.

**324 is the outer number, and the content column is 298.** Tailwind's box-sizing is `border-box`,
so the 1px border sits inside the width where Figma's slot is 300. Measured. The library matches
the outer number — Tooltip's 32, Select's 24/32/40 — so 324 is right and those 2px are the border
Figma's frames do not carry. **Do not "fix" this to 326.**

**`width` is a number, and it is the one axis Figma can never mirror.** Figma's four property
kinds are VARIANT, BOOLEAN, TEXT and INSTANCE_SWAP — none of them is a number — the wall Card's
`padding` hit, where the answer was an instance token rebind. A width has no token to rebind to, so
the file will keep drawing 324 and this stays a code-only prop. That is a stated asymmetry, not
drift, and it is not a gap for someone to close later. Astryx has the same prop and uses a
different value in all four of its examples. It arrives as `--popover-width` set on the
**Positioner** rather than an inline `width` on the popup: a custom property inherits, so
`w-(--popover-width)` still resolves one level down, and it leaves the popup's own `style` free for
the caller. `twMerge('w-(--popover-width)', 'w-96')` → `w-96`, so `className` still wins.

**The popup recipe is copied from `Menu/styles.ts`, not imported, and that is the rule working.**
Base UI's `popover` subpath exports its own `PopoverPopup`, `PopoverPositioner` and the rest — it
shares no component objects with `menu`. The test is *"is it the same primitive underneath"*, and
the answer is no. ContextMenu imports; this duplicates, the way Combobox duplicates Select.

**`outline-none` is load-bearing, and for a stronger reason than Menu's.** Base UI spreads
`tabIndex: -1` onto the popup unconditionally, and when the content has nothing tabbable in it —
which is Figma's own drawing — focus lands on the popup itself. Measured on the `Triggers` story:
click the Button trigger and `document.activeElement === popup`, with the browser ready to paint
its own 1.5px ring there in the system accent color. Menu's popup is only focused when opened by
click; this one is focused by default for the file's own example.

**Focus does not otherwise move into the panel, and that is correct.** Measured on `FilterPanel`:
opening by click *or* by Enter leaves focus on the trigger, and Tab walks in from there. A popover
is non-modal, so it behaves like a disclosure rather than a dialog you are placed inside.
`initialFocus` and `finalFocus` pass through for the two cases worth overriding — a confirm panel
that should not open on Delete, and one whose action removes its own trigger from the DOM so Base
UI has nowhere to return focus to.

**No focus ring from `src/lib/focus.ts` goes on any part here, and that is the answer rather than
an omission.** `focusRing` belongs on the trigger, which is the caller's own Button or Link and
already carries one — a second would be the two-rings-on-one-control failure. `focusRingWithin` is
wrong on the popup: it has many focusable descendants, each already ringed, and a container that
rings identically wherever focus is inside it says nothing. `focusRingUnhovered` is for lists on
`highlightItemOnHover`, which a popover has none of.

**`Popover.Close` is one part with a default rather than two parts or a variant.** Astryx uses
Close in two visually unrelated forms — the `×` in a header and "Cancel" beside a confirm action —
so the default *is* the `×` (Banner's and Toast's dismiss button, at `ghost` rather than `overlay`
because a popover's surface is Surface/Background Primary, and at the default size per the
default-size-first rule) and `render` replaces it outright. A variant deciding which shape it takes
would be the "worse abstraction than two short lists of classes" test, failed.

**No `Header` composite, on purpose.** Astryx names Header as an element, but Figma's component has
exactly one property and it is a SLOT, so inventing a frame the file has not drawn goes past
code-first into designing in code — and Card's evidentiary bar (*something has already been
reinvented in its absence*) cannot be met by a component that did not exist until today. The header
is `flex items-center justify-between gap-2` at the call site. If several callers hand-roll the same
row, that is the evidence, and the part can land then.

**Figma's `overflow-clip` is not ported — the twelfth time**, and here it would actually have been
safe: content sits 12px in and a focus ring reaches 4px outside its control, more slack than the
8px Menu measured. It is `max-h-(--available-height) overflow-y-auto` instead, which clips to the
radius just the same and keeps a panel that lands near the viewport edge on screen. **A floor, not
a feature** — Astryx says content that needs to scroll should have been a Dialog. Measured: at a
300px viewport the panel clamps to 290 and scrolls, and at 460 it flips side and stays wholly on
screen. One caveat: `overflow-y: auto` makes the popup a scroll container, so a *text-only* popover
long enough to scroll would fail axe's `scrollable-region-focusable`. Every panel with a button in
it passes.

**Two Base UI traps.** `modal` is a **no-op for focus trapping unless a `Popover.Close` is rendered
inside** — `focusManagerModal = modal !== false && hasClosePart` in `PopoverPopup`, silently, with
no warning. And a **Link trigger needs `nativeButton={false}`**: at the default Base UI dev-warns
and renders an `<a>` with no `href`, which cannot take focus, so the trigger quietly does nothing
for a keyboard. Verified in the browser — with the flag the anchor gets `role="button"` and
`tabIndex=0`. ContextMenu's "the render target has to hold up its end" failure in a new spelling:
nothing errors, it just does not work.

Left out: `Arrow` and `Backdrop` (Figma draws neither, and Base UI already catches the outside
press), and `Viewport` together with `Handle`/`createHandle` — **one decision rather than two**,
because Viewport exists only for a popup opened by several triggers with animated content
transitions, every clause of which presupposes the detached-trigger system. `openOnHover` reaches
the trigger through the pass-through and should stay unused: Astryx puts hover previews on
HoverCard and helper text on Tooltip, and a `role="dialog"` opened by hover is a bad contract.
Astryx also says not to nest popovers; Base UI will happily let you, and there is nothing to
enforce.

**Story trap:** a closed popover has no popup in the DOM at all, so the suite's axe run would pass
by looking at nothing — Menu's and Toast's lesson. `Anatomy` and `ConfirmAction` start open, and
they are two rather than one because they exercise the **two different naming paths**, named-by-
`label` and named-by-Title, which are different code in Base UI. Do not force several open at once
without `initialFocus={false}`, or their focus managers argue over `document.activeElement`.

**`text-base` throughout, with the Description at `text-content-subtle`.** Banner's pairing rather
than Menu's: the size is held and only the color changes, because this is body text and not a
sub-label under a row. On the Olive ramp it measures 6.9:1 light and 7.29:1 dark on the panel, so
the non-default ramps are clear.

**The file has caught up, and then corrected the code — both directions in one day.** `Title`,
`Description` and `Close` were drawn into the component, and the stack gap rebound from `spacing/0`
to `spacing/2`; nothing here changed when they arrived, which is the Accordion route working on a
whole part set rather than a variant axis. Measured on both sides: 12 padding, an 8 stack gap, a
32-tall header row on an 8 gap, a 42×32 close button, `text-base/semibold` on `Content/Primary`,
`text-base/normal` on `Content/Subtle`.

**Then two things came back the other way**, which is ContentBlock's header padding again — the file
correcting the code rather than following it.

- **The header row is `items-center`, not `items-start`.** Drawn top-aligned first, and Nathan
  centered it. He is right and the number says so: with a one-line title the button's center and the
  title's first-line center land **exactly 0px apart** centered, against 4px apart top-aligned.
  **The cost is a wrapping title**: at two lines the header grows to 48, the 32px button centers
  against that, and the × ends up **12px below** the first line it belongs to. Figma draws one line,
  so the canvas cannot see this. If it ever matters the fix is not to go back — it is `items-start`
  on the row plus `py-1` on the Title, which pins the button to the first line at 0px in *both*
  cases. Left undone deliberately: it adds a box to the Title that Figma does not draw, for a
  two-line title nothing has asked for yet.
- **The header frame had a `#FFFFFF` fill**, from `figma.createAutoLayout()`'s default, and Nathan
  removed it. No code counterpart — the row here has never had a background — but it is worth
  recording as a **Figma-authoring trap**: a white frame on a white popover is invisible on the
  canvas in light mode and would have painted a white band across the header in dark, where the
  surface is `Surface/Background Primary` at stone-900. `createAutoLayout()` and `createFrame()` both
  arrive opaque white; a layout-only frame wants `fills = []` set explicitly.

The old `gap-2` note is worth keeping for why it was ever a question: Figma bound the slot's gap to
`spacing/0`, but the frame had exactly one child, so its itemSpacing was never a decision anyone
made. Mechanism, not decision — and the catch-up is what turned it into one.

**Figma's properties are `Title` / `Title Text` / `Description` / `Description Text` /
`Is Dismissable`**, which is Banner's vocabulary (a bare noun for the boolean, `<Noun> Text` for the
string). Two things about that set are deliberate:

- **`Title` hides the whole header row, not just the text.** An empty auto-layout row would still
  spend the stack's 8px gap, which is a visible artefact. The cost is that **a close button with no
  title is not expressible in the file** — it is in code, and it is a shape nothing has asked for
  yet. If one ever does, the fix is a third boolean on the row rather than uncoupling these two.
- **The header row is a frame in Figma and deliberately not a part in code.** Figma has to have
  something to sit the title beside the button; the code does not, and `flex items-center
  justify-between` at the call site is the whole of it. Seeing `Header` in the layer tree is not
  evidence that `Popover.Header` should exist — Card's bar still applies.

**And what the library owes.** Both of Astryx's "don't" rules — heavy input, and content that needs
scrolling — point at a **Dialog**, which does not exist here. Popover landing is the evidence Card's
record asks for.
