# Dialog

A modal surface that blocks the page until you answer it. Mirrors Figma node `40004383:17046` on
the `↪ Dialog` page (`40004383:16847`), which has **no variant set** and exactly two component
properties — a TEXT `Title Text` and a SLOT `Content` — so, like Tooltip and Popover, there is not
a single `tv()` variant here and everything interesting is behavior.
**Sixth Base UI component that portals**, and the second to carry `role="dialog"` — but the first
that is genuinely modal. Compound API: `<Dialog>` + `Trigger` + `Popup` + `Title` / `Description` /
`Body` / `Close`. **`Dialog.Popup` swallows Portal, Backdrop and Viewport** — Menu's move, held by
Popover.

**This is the component the library had been pointing at in three places**, and the roadmap entry
said what to look for: a debt earns its build when the file draws it *and* something has been
reinvented in its absence. Both halves landed at once — Figma drew the component, and Popover's
`max-h-(--available-height) overflow-y-auto` was already standing in for the scrolling case with
its own record calling it "a floor, not a home". `Dialog.Body` is the home.

**Three things Popover settled one way and modality settles the other.** Focus moves *into* the
dialog on open rather than staying on the trigger. Everything outside the portal goes
`aria-hidden` and the body's overflow is locked. And a Backdrop is required rather than skippable.
All three are asserted in the `Playground` story rather than assumed, for a reason under "Story
traps" below.

## What Figma draws, and the one number that looks like a slip

Read off the node, not a screenshot: `paddingTop: 12`, `paddingBottom: 16`, `paddingLeft/Right: 16`,
`itemSpacing: 12`, `cornerRadius: 12`, `strokeWeight: 1` INSIDE, `Elevation/Drop Shadow/High`.

**The 12 on top against 16 at the bottom is deliberate.** It is optical compensation: the header is
a 32px row holding 24px of text, so 12 of frame padding puts the title's own box 16 from the top,
which is what the eye measures. ContentBlock's header padding is the same idea arriving from the
other direction. **Do not "fix" this to 16.** The cost is that a dialog with no title sits 4px high
— and the file cannot express that shape anyway, since `Title Text` is not optional there.

Measured in the browser at the settled state: **600 × 138** outer, header row **32**, close button
**42 × 32**, gap **12**, radius **12**, shadow `0 16px 32px` at 25%. The 138 against Figma's 136 is
the 1px border top and bottom — Tailwind's `border-box` puts the stroke inside the width where
Figma's frame does not carry it. Popover's 324/298 asymmetry, in a second place. **Do not "fix"
this to 136.**

`shadow-high` is the first use of the top of the elevation scale in the library. Popover is
`shadow-medium`; a dialog floating over a scrim should not sit at a panel's height.

## The scrim, which took two tokens and a measurement

**The obvious token was wrong, and only dark mode showed it.** It was built on
`surface-canvas-overlay` first — the token literally named "an overlay on the canvas", which
looked like the correct-by-name choice and made Kbd's "right value, wrong name" warning seem
inapplicable. In light it measured fine: canvas `#f5f5f4` → `#e0e0df`, 1.32:1 against the white
dialog.

In **dark** it is `neutral-100` at 10%, not `neutral-800` — because it is a hover wash, and a hover
state *lightens* on a dark canvas. So the backdrop raised the page from `#0c0a09` to `#232121`
while the dialog's own surface is `#1c1917`: **the page behind came out brighter than the dialog
sitting on it**, and the dialog read as a hole rather than as something lifted. Exactly backwards,
and completely invisible from the light-mode screenshot.

`surface-drop-shadow` replaced it and darkens in both themes — `neutral-800` at 25% light, black at
50% dark. Measured across four ramps, both themes, by rasterising the composite rather than parsing
`getComputedStyle` (see the trap below):

| ramp | light: canvas → scrimmed, dialog vs scrim | dark: canvas → scrimmed, dialog vs scrim |
|---|---|---|
| Stone | `#f5f5f4` → `#c1c0c0`, **1.82:1** | `#0c0a09` → `#060504`, **1.16:1** |
| Olive | `#f4f4f0` → `#c2c2bd`, 1.79:1 | `#0c0c09` → `#060604`, 1.20:1 |
| Mauve | `#f3f1f3` → `#c1bcc1`, 1.87:1 | `#0c090c` → `#060406`, 1.15:1 |
| Slate | `#f1f5f9` → `#bbc1c9`, 1.81:1 | `#020618` → `#01030c`, 1.16:1 |

The scrim darkens on every one, and the separation is stable across the swap because the token is a
neutral alias like everything else in the semantic layer. Dark's numbers are small because the
canvas is already near-black and 50% black over it has little room — the direction is what matters,
and the dialog now sits *above* its backdrop rather than below it.

**This is knowingly the elevation family's token doing a surface job**, which is the trade Kbd's
record warns about. It is taken deliberately, with the numbers above as the justification, and
**what it owes the file is a `Surface/Backdrop` token** — a semantic name for the role, in both
modes. That is the clean fix and it has not been done.

## `Dialog.Body`, and why it exists when `Dialog.Header` does not

Both are frames in Figma. Only one is a part here, and the difference is worth stating because it
looks inconsistent.

`Header` is a *drawing mechanism*: Figma has to have something to sit the title beside the button,
the code does not, and `flex items-center justify-between gap-2` at the call site is the whole of
it. Popover's record settled that, and seeing `Header` in the layer tree is still not evidence.

`Body` is a *behavior*. It is the scroll container, and without it the scrolling case has no home —
which was one of the two reasons this component was owed. Figma's `Content` slot is the frame it is
the code name of, and Astryx marks Body a required element.

**The mechanism is two classes and one of them is easy to lose.** The popup is capped at
`max-h-full` inside a `p-4` viewport; the Body is `min-h-0 flex-1 overflow-y-auto`. Drop the
`min-h-0` and nothing scrolls at all — a flex child's default `min-height: auto` refuses to shrink
below its content, so the popup grows straight past its own cap. Measured on the `Scrollable` story
at a 900-tall viewport: popup 868 (= 900 − the two 16px gutters), body 724 visible against 840 of
content, and after scrolling 116px the header is still at top 29 and the footer still at bottom 867.

**It is deliberately not required.** A `flex-1` region in a `max-h-full` column with nothing to
overflow just makes a short dialog as tall as the viewport allows. Reach for it when the content is
long, and not otherwise.

## The z-index goes on two elements, which is new

Every other portalled popup in the library has a single Positioner to put `overlayLayer` on. **A
Dialog has no Positioner at all** — the Backdrop and the Viewport are `fixed` siblings inside the
Portal. Either one left on `z-index: auto` is punched through by any positioned `z-10` on the page,
which is not hypothetical: that is how `Token.Remove`'s crosses once floated over an open Combobox.
Both get 40, and the Viewport is written second so it paints above the scrim. Toast's `z-50` stays
the top of the library, deliberately — a toast raised by the action you just took should not be
hidden behind the dialog you took it in.

## Width

`width` is a number defaulting to Figma's **600**, and it is the one axis the file can never mirror:
Figma's four property kinds are VARIANT, BOOLEAN, TEXT and INSTANCE_SWAP, none of which is a number
— the wall Card's `padding` hit. Astryx has the same prop and defaults it to 400; the file wins.

It arrives as `--dialog-width` on the **Viewport** rather than as an inline width on the popup, for
Popover's two reasons plus one of its own: a custom property inherits so `w-(--dialog-width)` still
resolves a level down; it leaves `className` able to win through `twMerge`; and the popup's own
`style` is already spoken for, because Base UI writes `--nested-dialogs` onto it.

The clamp is `max-w-full` against the Viewport's `p-4`. Measured at 375 wide: a 600-requested dialog
renders **343** with 16px gutters either side and no horizontal scroll.

## No `purpose` prop

Astryx has one word — `info` / `form` / `required` — over two unrelated Base UI mechanisms. `form`
is `disablePointerDismissal` on the Root; `required` is cancelling the `escape-key` reason inside
`onOpenChange`. Both already reach the caller free through the Root pass-through, and folding them
into one word buys a name while losing the ability to mix them. The `Form` and `Required` stories
write each one out, which is also the argument.

## Story traps

**A modal dialog cannot use `defaultOpen` in this repo, and that is not a style preference.** Base
UI marks everything outside the portal `aria-hidden` — verified: `#storybook-root` gets
`aria-hidden="true"` and `body` gets `overflow: hidden` while one is open. On a Storybook **docs**
page that is every other story on the page. Popover could leave one open because it is non-modal;
this cannot. Coverage comes from a `play` function that clicks the trigger, which the a11y addon
runs *after*, so the isolated test render still gets a real open modal for axe to look at.
`ContextMenu.stories.tsx` is where that pattern already lived.

**`findByRole` lands one frame too early.** It resolves on the frame the popup is inserted, which is
the frame it still carries `data-starting-style` — so opacity is 0 and `toBeVisible` correctly says
so. Both new play functions wrap that assertion in `waitFor`. Popover's stories never met this
because `defaultOpen` had them settled before any assertion ran.

**Measuring this in the Browser pane needs two guards, and both cost real time here.** A
backgrounded pane never advances the animation clock, so the popup stays on the starting frame
forever — the first measurement came back **570 wide**, which is 600 × the `scale-95`, read through
`getBoundingClientRect`. Two lessons: `offsetWidth` is the layout width and ignores transforms, and
Tailwind's `scale-*` sets the **`scale` property, not `transform`**, so `getComputedStyle(el)
.transform === 'none'` is not evidence the scale is gone. Pin `transition: none` and `scale: 1`
before believing any number. `requestAnimationFrame` also never fires there — one call hung the pane
for 45 seconds.

**And do not parse a color out of `getComputedStyle`.** Chrome returns `oklch()` and `oklab()`
verbatim, so a regex over the digits reads the *hue angle* as a blue channel: the first scrim
measurement came back `rgb(1,0,106)` for `oklch(0.97 0.001 106.424)`, which looks like a plausible
color and is nonsense. Rasterise instead — fill a 2D canvas and read `getImageData`. That also
composites the alpha for free, which is the actual question a scrim asks.

## Left out on purpose

`Handle` / `createHandle` and the detached-trigger system, which is Popover's call for Popover's
reason. Nesting: Base UI supports it and publishes `--nested-dialogs` and `data-nested-dialog-open`
for styling a stack, but Astryx says plainly not to nest dialogs and to restructure into steps
instead, so nothing here styles the nested case. `Dialog.Viewport` is used for centering only, not
as the scroll container — `Body` is.

## The file has caught up, and one thing cannot

Three debts were opened when this shipped and two are closed. **Nothing in the code changed when
they landed**, which is the test of whether a catch-up was really a catch-up — Accordion's route,
after Popover's whole part set took it the same way.

- **The description was Popover's, copy-pasted verbatim.** It read "A click-triggered panel anchored
  to a button or a link… Width is fixed at 324" on a 600-wide dialog. Rewritten.
- **The Description line is drawn**, and with it the property set became Popover's vocabulary
  exactly: `Title` / `Title Text` / `Description` / `Description Text` / `Is Dismissable` /
  `Content`. It was cloned from Popover's own Description node rather than rebuilt, so it carries
  the same type style and the same `Content/Subtle` binding — the file's version of sharing a part.
- **The Backdrop is drawn**, in the Docs previews rather than inside the component, because it sits
  behind the dialog rather than in it. Bound to `Surface/Drop Shadow`, so the canvas and the code
  paint the same scrim.
- **The Docs page is filled** — Light and Dark previews, each with a Confirmation and a Required
  example on a scrim, and six Best Practices. Worth knowing that the Best Practices block is a
  template placeholder reading "Usage rule." on **every** page in the file, Popover's included, so
  Dialog is the first one filled rather than the only one behind.

**`Body` is the one that cannot land, and that is a property of Figma rather than a debt.** A
scrolling region with a pinned header and footer has no static drawing — a clipped frame would be a
picture of the wrong thing. It is carried on the page as a Best Practices rule instead: *"Put long
content in a scrolling body, so the title and the close button stay in place while the content moves
under them."* That is the file holding a behavior as guidance, which is the right place for it.

**Still owed: a `Surface/Backdrop` token.** The scrim is `Surface/Drop Shadow` on both sides now,
which is the elevation family's token doing a surface job — see the scrim section above. Drawing the
backdrop did not fix that; it only made both sides wrong in the same way, which is at least
honest.

## Best practices

Mirrored from the **Best practices** block on `↪ Dialog` (`40004383:17074`) in Figma.
The two are one text in two places — change one and change the other.

**Do**

- Give every dialog a title. It is what names the dialog for a screen reader, and it tells everybody else what they are being asked.
- Turn the close button off when the user has to choose. A dialog that can be dismissed is a dialog whose question can be skipped.
- Put long content in a scrolling body, so the title and the close button stay in place while the content moves under them.

**Don't**

- Do not use a dialog for a message. If nothing is being asked, a Banner or a Toast is the right shape.
- Do not nest one dialog inside another. Restructure the flow into steps within a single dialog instead.
- Do not lean on the red alone to signal danger. The action label itself should say what will happen.
