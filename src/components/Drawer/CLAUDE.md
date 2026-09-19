# Drawer

A surface that slides in from an edge of the screen, over the page: a scrim, a focus trap, the
page inert until it is dismissed, and a swipe toward its edge to dismiss it. Base UI's `Drawer`
under Dialog's wrapper shape. Right by default, left and bottom too — and on a phone, always the
bottom.

Built on 2026-09-19 with `Panel`, as a pair: the one that **overlays** and the one that
**pushes**. Nathan's framing, and the reason two components exist rather than one with a prop.

## Figma

Page **`↪ Drawer`** (`40004748:43535`), an empty `(In Progress)` page until 2026-09-19, drawn
from the built component the same day — the ProgressBar route, with nothing to read first.

| Thing | Node | Became |
|---|---|---|
| Drawer (`Side` Right \| Left \| Bottom) | `40005378:46033` | `Drawer`, its `side` prop; `Content` slot = `Drawer.Body`'s room |
| Docs frame (header, Light + Dark preview, 5 Do / 2 Don't) | `40005378:45847` | this record's Best practices |
| Components section | `40005379:46002` | — |
| `Drawer Stacking`, three `Side=Right` instances stepped 12 on a scrim | `40005414:45652` | the stack, see **Stacking** |

**What the set draws.** `Side=Right` and `Side=Left` are 384 × 1024, `Side=Bottom` 1440 × 480,
each on `Surface/Background Primary` with a 1px `Surface/Border` on the **inner edge only** —
the other three stroke weights bound to `border-width/border-0` — and `border-radius/rounded-lg`
on the two inner corners with `rounded-none` on the two at the viewport edge, the shell's
docked rule drawn per side. The shadow is the matching effect style: `Elevation/Drop
Shadow/High - Left` for Right, `High - Right` for Left, `High - Top` for Bottom — the three
directional variants the elevation family already had. Header and Content are Panel's exactly
(the variants are clones of Panel's card), the header reading "Drawer title".

**What the preview draws that the set does not.** The scrim — a `Surface/Drop Shadow` rectangle
over a `Surface/Canvas` stage with the right drawer flush to its edge — sits in the Docs
preview, not in the component, Dialog's arrangement for Dialog's reason: it is behind the
drawer, not in it. `modal`, the swipe and the phone rule are behaviour; the record carries them.

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

**The header is ContentBlock's at the TopBar's height, and its title is `Drawer.Title`.** 56
on 12 of padding (`height: 'bar'` on the shared recipe) rather than the block's 48 on 8 — a
drawer's title row lines up with the bar it slid over. `Drawer.Header` renders the
shared `BlockHeader` with the heading being Base UI's Title, so the popup's `aria-labelledby`
points at it; that is why `BlockHeader` takes an *element* for the heading rather than text. A ×
on the end by default, `closeButton={false}` to remove it. Same recipe as `Panel.Header`, so a
drawer and a panel holding the same thing look the same — which is the point of them being a
pair.

**No padding on the popup.** `Drawer.Header` carries `px-4 py-2` and `Drawer.Body` `px-4 pb-4`,
ContentBlock's numbers; a caller composing raw `Drawer.Title` gets to choose its own.

**A drawer inside a drawer stacks, on Base UI's variables, to Panel's numbers.** Nesting is
built into the primitive: a `Drawer.Root` inside another one's content gives the parent's
popup `--nested-drawers` (how many are in front of it), `data-nested-drawer-open`, and —
while the front one is being swiped — its swipe progress in `--drawer-swipe-progress`; the
nested popup and viewport get `data-nested`, and a nested `Drawer.Backdrop` renders nothing
unless `forceRender`. What the recipe adds is `--drawer-stack`:
`max(0px, (nested − clamp(progress)) × spacing/3)` — 12px per level, Figma's `Panel
Stacking` rather than Base UI's `scale()`, coming back to zero under the finger as the front
drawer is swiped away. A right drawer steps left by it (`translate-x`, on the same property
as the swipe and the entrance) and takes it as `my-*` with `self-stretch`, so it loses 12 at
each end; a bottom sheet steps up, takes it as `mx-*`, and takes the front sheet's height —
`data-nested-drawer-open:h-(--drawer-frontmost-height)` — so sheets of different heights
line up behind one another. Widths never change. `Drawer.Content` fades to 0 behind a front
drawer and comes back while it is being swiped, Base UI's demo; the levels behind are
`aria-hidden` by Base UI's own focus management, so only the front is live. On a phone every
level is a bottom sheet, because every Root runs `usePhone` for itself. **The peeking edge is a
way back, for free:** what is under the pointer there is the *front* drawer's own viewport
(`fixed inset-0`, over everything behind it), and Base UI's outside-press dismisses a modal
dialog on a press on any ancestor of its popup that is not the portal — which is the viewport.
The stacked story presses `document.elementFromPoint` there rather than the popup behind, which
a real pointer can never reach.

**The viewport is `overflow-clip`, not `hidden`, and stacking is what found it.** `hidden`
is still a scroll container: a `focus()` into a popup that is still sliding in scrolls the
viewport sideways to reach it, and every level of the stack then measures 36px off for
good. `clip` cannot be scrolled by anything and still hides the bleed.

**Non-modal is a prop, not a component.** `modal={false}` drops the Backdrop, lets pointer events
through the viewport, and leaves the page live; pair it with `disablePointerDismissal` or a click
on the page closes it. The `Non-modal` story exists to say when to reach for it — and that if the
page and the drawer are *usually* used together, it is a `Panel`.

## Traps

- **`Drawer.Popup` throws without `Drawer.Portal`** (the same `useDialogPortalContext` Dialog
  uses), and without `Drawer.Viewport` it only *warns* and silently loses swipe handling. The
  wrapper always renders both; a raw-parts caller has to remember.
- **Never `defaultOpen` in a story.** A modal drawer inerts the whole docs page. Every story opens
  itself in `play`, Dialog's rule — and then *stays* open. The stories that close it again
  (`Playground, driven`, `InContext, driven`) are twins sharing the demo's render function, so a
  drawer that opened and shut itself on load does not read as an animation bug.
- **`defaultOpen` under SSR with `usePhone`** renders a side drawer for the hydration frame and a
  sheet the next. Documented, not worth a second mechanism.
- **The animation clock in the Browser pane is slow.** A screenshot a few seconds after opening
  the phone story showed only the sheet's header at the bottom edge — the slide half-way. The
  geometry read settled; the picture had not.
- **Motion cannot be verified headless.** The stories assert the settled numbers and the data
  attributes; the slide and the swipe want a person in a real browser, MobileNav's rule.
- **A role query skips a covered drawer.** Base UI marks the levels behind the front one
  `aria-hidden`, so `queryByRole('dialog', { name })` finds only the front; the stacked stories
  pass `hidden: true`, and assert the hiding separately. `data-nested` is on the nested popup
  *and* its viewport, so counting `[data-nested]` gives two per level.
- **Wait for a level to settle before opening the next from it.** Clicking on while the popup
  is still sliding in is the focus-scroll trap above, in test form.

## Measurements to check if this changes

- Right: 384 wide (`width`), `right === innerWidth`, full height, `rounded-l-lg` 12,
  `border-l` 1, `data-swipe-direction="right"`.
- Left: the mirror, `left === 0`.
- Bottom: `bottom === innerHeight`, full width, content-height up to `85dvh`, `rounded-t-lg`.
- Phone (393 × 852), `side="right"`: a bottom sheet, 393 wide, `data-swipe-direction="down"`.
- Header 56 tall, `py-3`; focus inside on open, back on the trigger on close; page `aria-hidden` while
  open (modal), not (non-modal); non-modal portal holds one child, no Backdrop.
- Stacked, three levels: front `right === innerWidth`, full height; middle 12 in, 12 down, 24
  shorter; root 24 / 24 / 48; `--nested-drawers` 2 on the root, one scrim, covered content
  opacity 0, only the front not `aria-hidden`. Phone: every level a sheet, the one behind 12 up
  and 12 in each side, the front's height.

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

Mirrored from the **Best practices** block on `↪ Drawer` (`40005378:45847`) in Figma; the
"do not nest" Don't came off and the fifth Do (`40005414:45708`) went on with stacking, 2026-09-19.
The two are one text in two places — change one and change the other.

**Do**

- Reach for a Drawer when the page should wait — filters, a form, a preview — and for a Panel
  when the user works in both at once.
- Give it a `Drawer.Header`; the title is what names it for a screen reader.
- Put the long part in a `Drawer.Body` so the title and the × stay put while it scrolls.
- Let it become a bottom sheet on a phone; that is the default, and it is the better gesture.
- Open a follow-up step as a Drawer written inside the first one; it stacks over its parent, 12px
  in, and keep a stack to two or three — each level hides the one behind it.

**Don't**

- Do not inset it from the edge; a card floating on a scrim is a Dialog.
- Do not use `modal={false}` as the usual case; that is a Panel wearing a portal.
