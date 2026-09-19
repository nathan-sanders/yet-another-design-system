# Drawer

A surface that slides in from an edge of the screen, over the page: a scrim, a focus trap, the
page inert until it is dismissed, and a swipe toward its edge to dismiss it. Base UI's `Drawer`
under Dialog's wrapper shape. Right by default, left and bottom too — and on a phone, always the
bottom.

Built on 2026-09-19 with `Panel`, as a pair: the one that **overlays** and the one that
**pushes**. Nathan's framing, and the reason two components exist rather than one with a prop.

## Figma

**No node yet; the code went first.** The `↪ Panel (In Progress)` page draws the in-flow Panel
and nothing for this. The shape here is what Base UI's primitive and the rest of the library
already settled — Dialog's parts, ContentBlock's header, MobileNav's sheet — and the file owes a
page: a `Drawer` set with `Side` right | left | bottom, a Docs frame, and a Best practices block
to mirror the one below. Three things it may overturn when it lands, each a one-class change:
the 1px `Surface/Border` on the inner edge, `Elevation/Drop Shadow/High - Left` (and Right, Top)
toward the page, and the 384 width.

## Decisions

**Base UI's `Drawer`, the seventh Base UI component that portals.** Its `drawer` subpath has its
own `Root`, `Popup`, `Viewport`, `Backdrop`, `Content`, `Title`, `Description`, `Close`, `Trigger`
and `Portal` — Dialog with gestures, not Dialog's objects re-exported, so nothing is re-attached
from `Dialog` the way `AlertDialog` does it. What *is* shared is the scrim's recipe
(`Dialog/styles.ts`'s `backdrop()`, because `surface-drop-shadow` is the one token that darkens
in both themes — Dialog's record has the measurement) and the wrapper's shape: `Drawer.Popup`
swallows Portal, Backdrop, Viewport and Content, Menu's move held by Popover and Dialog.

**Three sides, and the phone takes one of them away.** `side="right"` is the default and matches
`Panel`; `left` mirrors it; `bottom` is the sheet the primitive was built for, MobileNav's
shape. Below 768 a side drawer *becomes* a bottom sheet — Nathan's call, and a 384-wide column
on a 393-wide phone would only have been a bottom sheet with a worse gesture. `swipeDirection`
is a Base UI prop, not a class, so CSS cannot flip it: this is the library's **one `matchMedia`
reader**, `usePhone` in `src/lib/viewport.ts`, and the exception is allowed for a reason
`ResponsiveNav`'s record spells out from the other side. The CSS-only rule exists to stop a
first-paint flash of the wrong layout; a closed drawer paints nothing, so there is no first
paint to get wrong, and by the time someone opens it the hook has its real answer. The rule is
applied in the **Root**, once, and the popup reads the result through context, so the classes
and the gesture cannot disagree. `Panel` must not use the hook — it paints on load.

**Flush to the viewport edge, rounded on the inner corners.** The shell's docked rule — a thing
hard against the window edge squares the edge it touches and keeps the corners that face the
page — which the MobileNav sheet already is at the bottom. An 8px-inset drawer would be a second
card floating on a scrim, and that is a Dialog. `shadow-high-left` for right, `-right` for left,
`-top` for bottom: the elevation family already had the directional variants.

**The bleed is a pseudo-element, not a bigger box.** A swipe in the *wrong* direction — pulling a
right drawer toward the page — is damped by Base UI to the square root of the distance
(`applyDirectionalDamping` in `useSwipeDismiss`), so a 900px pull moves the drawer 30px and would
show 30px of scrim between it and the edge. Base UI's demos cover that with a popup 3rem wider
than it looks and a negative margin, which puts the box's edge 48px past the viewport and made
every geometry assertion in the first run fail by exactly 48. Here the same 48px is an `::after`
painted past the edge in the surface color: the popup's box is exactly the 384 it says, the
viewport's `overflow-hidden` hides the bleed at rest, and a pull reveals it.

**`translate`, not `transform`.** Tailwind v4's `translate-*` writes the standalone `translate`
property (the Nav record found this the hard way), so the swipe offset
(`translate-x-(--drawer-swipe-movement-x,0px)`), the entrance and the exit
(`data-[starting-style]:translate-x-full`) all land on one property and cannot fight;
`transition-transform` covers it. While swiping the transition is off so the surface follows
the finger, and the scrim's opacity is `1 - --drawer-swipe-progress` so it thins with it.

**The header is ContentBlock's, and its title is `Drawer.Title`.** `Drawer.Header` renders the
shared `BlockHeader` with the heading being Base UI's Title, so the popup's `aria-labelledby`
points at it; that is why `BlockHeader` takes an *element* for the heading rather than text. A ×
on the end by default, `closeButton={false}` to remove it. Same recipe as `Panel.Header`, so a
drawer and a panel holding the same thing look the same — which is the point of them being a
pair.

**No padding on the popup.** `Drawer.Header` carries `px-4 py-2` and `Drawer.Body` `px-4 pb-4`,
ContentBlock's numbers; a caller composing raw `Drawer.Title` gets to choose its own.

**Non-modal is a prop, not a component.** `modal={false}` drops the Backdrop, lets pointer events
through the viewport, and leaves the page live; pair it with `disablePointerDismissal` or a click
on the page closes it. The `Non-modal` story exists to say when to reach for it — and that if the
page and the drawer are *usually* used together, it is a `Panel`.

## Traps

- **`Drawer.Popup` throws without `Drawer.Portal`** (the same `useDialogPortalContext` Dialog
  uses), and without `Drawer.Viewport` it only *warns* and silently loses swipe handling. The
  wrapper always renders both; a raw-parts caller has to remember.
- **Never `defaultOpen` in a story.** A modal drawer inerts the whole docs page. Every story opens
  itself in `play`, Dialog's rule.
- **`defaultOpen` under SSR with `usePhone`** renders a side drawer for the hydration frame and a
  sheet the next. Documented, not worth a second mechanism.
- **The animation clock in the Browser pane is slow.** A screenshot a few seconds after opening
  the phone story showed only the sheet's header at the bottom edge — the slide half-way. The
  geometry read settled; the picture had not.
- **Motion cannot be verified headless.** The stories assert the settled numbers and the data
  attributes; the slide and the swipe want a person in a real browser, MobileNav's rule.

## Measurements to check if this changes

- Right: 384 wide (`width`), `right === innerWidth`, full height, `rounded-l-lg` 12,
  `border-l` 1, `data-swipe-direction="right"`.
- Left: the mirror, `left === 0`.
- Bottom: `bottom === innerHeight`, full width, content-height up to `85dvh`, `rounded-t-lg`.
- Phone (393 × 852), `side="right"`: a bottom sheet, 393 wide, `data-swipe-direction="down"`.
- Header 48 tall; focus inside on open, back on the trigger on close; page `aria-hidden` while
  open (modal), not (non-modal); non-modal portal holds one child, no Backdrop.

## Left out

- **Snap points and `Drawer.SwipeArea`.** Base UI passes both through the Root (`snapPoints`,
  `defaultSnapPoint`) and the raw parts; nothing in the library asks for a half-open sheet yet.
- **`Drawer.Indent` / `IndentBackground`.** The iOS-style page-shrinks-behind-the-sheet effect
  needs the whole app wrapped in a `Provider`; an application can do it with the raw parts.
- **`Drawer.VirtualKeyboardProvider`.** For a bottom sheet full of fields on a phone; raw part,
  available.
- **Migrating `MobileNav`'s sheet onto this.** Its record left out "a drag handle and
  drag-to-dismiss" because Dialog had none; Drawer has both. Plausible, separate.

## Best practices

Written here first; the file has no Docs frame yet to mirror.

**Do**

- Reach for a Drawer when the page should wait — filters, a form, a preview — and for a Panel
  when the user works in both at once.
- Give it a `Drawer.Header`; the title is what names it for a screen reader.
- Put the long part in a `Drawer.Body` so the title and the × stay put while it scrolls.
- Let it become a bottom sheet on a phone; that is the default, and it is the better gesture.

**Don't**

- Do not inset it from the edge; a card floating on a scrim is a Dialog.
- Do not nest a drawer in a drawer without Base UI's `Provider` and the stacking variables.
- Do not use `modal={false}` as the usual case; that is a Panel wearing a portal.
