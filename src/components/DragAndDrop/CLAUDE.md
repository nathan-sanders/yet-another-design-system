# DragAndDrop

The drag foundation: a root (`DragAndDrop`), a container of items that can be reordered and moved
between containers (`Sortable` / `Sortable.Item`), the grip you carry one by (`DragHandle`), and
the arithmetic underneath (`move.ts`, `spans.ts`). Mirrors the `↪ Drag and Drop` page
(**`40005289:447`**), drawn on 2026-09-18 from the built code — the third record to go code → file
after `BentoGrid` and `ThemeControl`, and like `AppShell` the file caught up within a day. Three
sets on it: **`Drag Handle`** (`40005289:480`, State default | hover | focus), **`Sortable Item`**
(`40005289:41745`, State rest | lifted | over, with a `Content` slot), and **`Resize Handle`**
(`40005289:41760`, Orientation vertical | horizontal × State default | hover | focus). The Docs
frame is `40005289:41938`. No `Sortable` container set, on purpose: a container draws nothing of
its own except the inset ring an *empty* one shows while a card is carried over it, and that is one
frame in the Docs preview rather than a set whose resting variant would be invisible.

**What the file draws that the code derives.** `Drag Handle` is a ghost icon-only `Button` instance
with the grip glyph swapped in — the same composition `DragHandle.tsx` makes at runtime — so its
three variants are Button's three states and it has no properties of its own. `Sortable Item`'s
`Lifted` binds `opacity` to `opacity/opacity-50` and takes the `Elevation/Drop Shadow/Medium`
effect style; `Over` is a 2px `Surface/Border Emphasized` stroke, align OUTSIDE (a ring, not an
inset). `Resize Handle` binds its thickness to `width/w-4` / `height/h-4`, its pill to `w-1 × h-10`
(or `w-10 × h-1`) in `Surface/Border Emphasized`, `Hover` fills `Surface/Overlay Subtle`, and
`Focus` is the shared `Focus Ring` instance — the pill is at opacity 0 in `Default`, so the resting
variant is invisible on the canvas, which is also what the code renders.

Built 2026-09-17 from Nathan's Figma Make prototype *Composable Grid Layout* (file
`CBkiXb5N9223tUMrpwayUG`), which was read for its **interaction model** and not ported: it is
react-dnd on the HTML5 backend, and the section below on the engine says why that model stops at
the pointer. The two things it wants to build — a kanban board and a composable dashboard — are the
`Kanban` and `Dashboard` **stories**, not components. The foundation is the deliverable; a board and
a dashboard are compositions of it, the way the kanban in `ClickableCard`'s stories is a composition
of cards.

## The engine, and why a library at all

The root `CLAUDE.md` turned down a JS animation library twice and named drag as the one thing that
would earn one. This is that one. The bar was "check what the platform or the headless primitive
already does first", so:

- **HTML5 drag and drop** exists and was rejected. It has no keyboard path at all, touch support is
  a per-browser gamble, the drag image is a browser-rendered bitmap the token layer cannot reach,
  and `dragover` fires on a 350ms timer rather than with the pointer. The prototype lives on it and
  shows the ceiling: a mouse-only board.
- **Base UI** has no drag primitive. `Slider` and `Toast`'s swipe are the two pointer gestures in the
  library and both are single-axis on one element.
- **`@dnd-kit/core` 6.3 + `@dnd-kit/sortable` 10** is what shipped. Headless in the strict sense
  (it renders nothing but two hidden accessibility nodes), the keyboard sensor and the live region
  are built in, and — the reason it clears *this* library's bar — every transition it drives is a
  plain CSS string on `style`, so the motion tokens still own the numbers. Not `@dnd-kit/react`
  (0.5.x, a breaking minor every couple of months) and not Atlassian's pragmatic-drag-and-drop
  (HTML5 underneath, keyboard is a separate "move to" menu you write yourself).

The public surface — Root / Sortable / Item / Handle / the hook — is what insulates callers if the
engine ever changes.

## The grab model: pointer from anywhere, keyboard from the grip

A card on a board is picked up by pressing anywhere on it; that is what Trello, Linear and Mixpanel
all do and what a hand expects. But a `ClickableCard` is a `<button>`, and Space on a button has to
keep meaning *press the button*. So the two activators live on different elements:

- The **item** carries the pointer sensor's `onPointerDown`. A press that travels less than 4px is
  still a click — `activationDistance` on the root — and a press that travels more is a drag. After a
  drag the sensor stops the `click` at document capture, so a card does not open on release.
- The **`DragHandle`** carries the keyboard sensor's `onKeyDown`, and is the node given to
  `setActivatorNodeRef`. That matters: the KeyboardSensor refuses a keydown whose target is not that
  node, so Space on the card body cannot lift, and only the grip can.

`useSortableItem` is where dnd-kit's single `listeners` bag is split into `itemProps` and
`handleProps`. `Sortable.Item` spreads the first and hands the second to `DragHandle` through
context, so a caller writes `<Sortable.Item><ClickableCard /><DragHandle /></Sortable.Item>` and
wires nothing.

**The grip and a clickable card are siblings inside the item, never nested.** A `<button>` inside a
`<button>` is invalid HTML and axe's `nested-interactive`. In the kanban the grip is absolutely
positioned over the card's corner; in the dashboard it is in `ContentBlock.Header`'s `actions`.

**A control inside the item that must not start a drag marks itself `data-drag-ignore`** — the
dashboard's remove button. The item's `onPointerDown` returns before the sensor sees the press.
Cheaper than every such control calling `stopPropagation`, and it swallows nothing else.

**No `TouchSensor`.** The pointer sensor receives touch pointers already. What decides whether a
finger pans the page or carries the item is `touch-action`: the item body leaves it alone, so the
browser wins and dnd-kit gets a `pointercancel` and ends cleanly; the grip is `touch-none`, so a
press there drags. `Table.ResizeHandle` makes the same call for the same reason.

## Multi-container: the state is the caller's, the arithmetic is here

dnd-kit only knows droppables. Which container an item is *in* is state the caller keeps —
`Containers`, item ids by container id — and two handlers change it:

- **`onDragOver`** fires as the carried item crosses into another container. Move it *now*, while it
  is still carried: that is what makes a card visibly join the column it is over and the column grow
  to take it, which is the prototype's "sorts on hover". Within one container do nothing; the
  sorting strategy shifts the neighbours with transforms.
- **`onDragEnd`** settles the item's place within the container it ended in.
- **`onDragCancel`** restores the snapshot taken at `onDragStart`. Escape has to leave the board
  exactly as it was, across containers, and only the caller has the whole board.

`moveItem(containers, active.id, over.id)` is what both handlers call; `findContainer`,
`moveBetweenContainers` and `reorder` are its parts, exported for a caller with a rule of its own.
The dashboard's rule — an emptied row disappears — is deliberately **not** in `move.ts`: the kanban
keeps its empty column. Every function returns the same reference when nothing changes, because
`onDragOver` fires on every pixel.

**A container is a droppable in its own right** — `useDroppable` on the `Sortable` element — and
that is the whole reason an item can be carried into an *empty* container: with nothing to collide
with, the container's rect is the target and `over.id` is the container's id, which `moveItem`
reads as "append". The `Kanban` story's fourth column starts empty for exactly this path.

**A container can be full, and full is enforced at the droppable.** `Sortable`'s `capacity` is
the dashboard's four-to-a-row: at the limit the container and *every item in it* stop being drop
targets for anything from another container, so the pointer cannot land there and the arrow keys
skip past it, while its own items still sort among themselves and can be lifted out. This is the
fix for the first bug the story shipped with (2026-09-18): a fifth block carried into a full row
gave `distribute(5)` a 2-column span the class map cannot draw, and four blocks collapsed to the
width of their titles. Refusing at the droppable is what makes the refusal true for both sensors at
once; a guard in `onDragOver` alone would have left the keyboard announcing a slot it could not
take.

**"Ours" is `items.includes(active.id)`, never `active.data.current.containerId`.** The first
version read the carried item's container off its data, and it looped until React gave up: that ref
is written by the item's own render, which comes *after* the container's, so at the exact moment a
carried-in block makes a row full the row still sees the old container, refuses the block it just
took, the collision falls back to the source row, `onDragOver` moves it back, and the two rows hand
it to each other. The `items` prop has no lag. **A container knows its members synchronously; the
carried item's data does not.**

**`closestCorners`, not `pointerWithin`.** Pointer-within has no pointer on a keyboard drag, so it
returns nothing; and it never lands on an empty container, because the carried item's rect does not
overlap it. Corners does both. **Containers are measured continuously** (`MeasuringStrategy.Always`):
the default measures once at lift, and a column that grew because a card joined it would then be
aimed at from a stale rect.

## Keyboard across containers needs nothing extra

`sortableKeyboardCoordinates` considers every droppable in the arrow's direction — items in other
containers and the containers themselves — and picks the closest corner, so ArrowRight from a Todo
card lands on the nearest In Progress card, or on an empty column's rect. `onDragOver` then moves it
and React remounts the item's DOM node under the new parent; dnd-kit's `nodeRectDelta` compensates so
the item does not jump. After a keyboard drop dnd-kit's `RestoreFocus` refocuses the activator on the
next frame — which is the cross-container case, where the grip that had focus is a new element. The
stories assert `document.activeElement` is the item's grip after the drop.

**The stories drive the keyboard path only.** A drag is the one interaction with no keyboard
equivalent unless somebody writes one, so it is the path that regresses unnoticed; a synthetic
pointer drag in a browser runner is flaky in a way that teaches nothing. `ResizeHandle`'s ruling.
Pointer drags were verified by hand in the Browser pane in both themes: across columns, into the
empty column, from the block body, and *not* from the remove button.

**"Picked up" is never asserted.** dnd-kit follows `onDragStart` with an `onDragOver` for the item's
own slot in the same tick, so by the time a `waitFor` looks, the live region already says "is over".
The lift is read off the grip's `aria-pressed`, which is the state rather than the narration of it.
Everything after a keydown goes through `waitFor`: the handlers run in dnd-kit's effects, one frame
later, and a bare `expect` races them.

**One thing the pane cannot prove.** `RestoreFocus` runs on `requestAnimationFrame`, and a hidden
Browser pane does not advance frames, so the focus assertion fails *there* and passes in vitest's
Chromium. Same family as the headless-tab transition freeze in the root record.

## Motion: the numbers are the tokens, the decision is dnd-kit's

`useSortable` returns a `transition` string it has already decided: `undefined` for the
pointer-dragged source (it follows the pointer, nothing to ease), `transform 0ms linear` for the one
frame a derived transform is set up, and `transform 200ms ease` while neighbours shift or a keyboard
drag steps. The decision is worth keeping; the numbers are a second source of truth. So
`useSortableItem` keeps the first two and swaps the third for
`transform var(--transition-duration-fast) var(--ease-standard)` — `var()` resolves in an inline
`transition`, and a shifting row reads back `transform 0.175s cubic-bezier(0.24, 1, 0.4, 1)`.
`theme.css`'s reduced-motion rule is `transition-duration: 1ms !important`, which beats an inline
declaration, so the clamp applies with nothing further to do.

**The item moves in place; the overlay is opt-in.** With no `DragOverlay`, the carried item is the
item itself, moved with a transform: one element, one CSS transition, the tokens and the clamp for
free, and focus stays on the real grip. The one case that breaks is an item carried *out of* a
scroll container, which clips it at the edge. `DragAndDrop.Overlay` exists for that: a copy portalled
to `<body>` on `overlayLayerIndex` (40 — the number `overlayLayer` sets, added to `layers.ts` because
dnd-kit writes `z-index` inline and cannot take a class). Its drop animation is a Web Animations
call, which takes milliseconds and cannot read a `var()`, so `tokenDropAnimation()` reads
`--transition-duration-fast` and `--ease-standard` off the stylesheet as numbers at the moment it
fires, and returns `null` — no animation — under `prefers-reduced-motion`. **That is the library's
one WAAPI animation and the one place the preference is checked by hand.** The copy is a second
element with the same accessible name for the length of the drag, which is the other reason it is
not the default.

## The three looks, all tokens

`styles.ts`. The **lifted** item: `opacity-50` (the prototype's number and `opacity/opacity-50`),
`shadow-medium`, `select-none`, and `z-10` so it paints over later siblings as it crosses them — the
painting-order rule `layers.ts` documents, one layer down. The **drop target**: `ring-2
ring-surface-border-emphasized`, the same stroke `ClickableCard` uses for `selected`. It goes on the
`Sortable.Item` wrapper, **never on the card inside**, because the card's focus ring is also a `ring`
and two on one element overwrite each other. An empty container gets the same ring `ring-inset`. The
**grip**: `cursor-grab`, `cursor-grabbing` while dragging, `touch-none`.

`DragHandle` is a `Button` — `appearance="ghost"`, `startIcon={GripVertical}`, the default size —
so it inherits the focus ring, the 32px height a `ContentBlock.Header` slot fits, and the icon-only
rule that an `aria-label` is required. The label is `Move {label}`, from the `Sortable.Item`'s
required `label`, and `aria-roledescription="sortable"` with `aria-describedby` pointing at dnd-kit's
instructions node. Two items with the same label in one root is a `getByRole` ambiguity in a test and
a list a screen reader cannot navigate; demo data uses distinct names.

## Announcements say names

dnd-kit's defaults read ids — "Draggable item 3 was moved over droppable area 2". `announcements.ts`
reads the `label` every item and container is required to carry: *Picked up Alice.* / *Alice is over
In Progress, position 2 of 3.* / *Alice dropped in In Progress, position 2 of 3.* / *Move cancelled.
Alice is back where it was.* The instructions are the same voice: "Press Space to pick this up. Use
the arrow keys to move it. Press Space again to drop it, or Escape to put it back." The live region
is dnd-kit's own `role="status" aria-live="assertive"`, rendered inline inside the root with its own
visually-hidden styles, so it is inside `canvasElement` and a play function can read it.

## The dashboard's arithmetic

`spans.ts`, from the prototype's `GridRow.tsx`: twelve columns, at most four blocks to a row, none
narrower than three; `distribute(n)` gives each `floor(12/n)` and the remainder to the last so the
row closes on the right, and a lone block gets 12. `COL_SPAN` is written out in full because Tailwind
scans source text and a template literal generates nothing — `BentoGrid`'s rule. The row's add rail
is the prototype's: a strip on the row's edge, `opacity-0` until hover and `focus-visible`, `disabled`
at four so it stays in the tab order and says no rather than vanishing.

**Resize is the prototype's other half, and it landed on 2026-09-18.** Two handles, one
component: `ResizeHandle` with an `orientation`. Between two blocks it is the prototype's
`Item Resize Handle` — the 16px gap itself, `col-resize`, snapping the *left* block to a column —
and under a row it is the `Row Resize Spacer`, the 16px between rows, `row-resize`, setting the
row's height. It is `Table.ResizeHandle` made general: a focusable `separator` with
`aria-valuenow`/`min`/`max` (a widget role owes all three, and axe checks), a pointer path on
`setPointerCapture`, and a keyboard path — arrows step, Shift steps further, Home and End go to the
ends — which is the path the story tests. It reports a **value in the caller's unit** rather than
pixels: the column handle reports spans, with `unit` a function that measures one twelfth of the row
when the drag starts, and the row handle reports pixels. `aria-valuetext` says "6 of 12 columns".
`data-drag-ignore`, always — it sits inside a `Sortable.Item`, and a press on it is a resize.

The arithmetic is `spans.ts`, tested in node, and it is the prototype's `GridRow.tsx` read
carefully:

- **`resize(spans, index, next)`** — the block takes what it asked for, clamped between `MIN_SPAN`
  and whatever leaves every block to its *right* at `MIN_SPAN` (`maxSpan`), and the right blocks
  share the remainder **in proportion to what they had**, so a wide neighbour stays the wide one.
  Blocks to the left are untouched, and the last block has no handle because it has nothing to
  take from. Largest-remainder rounding, so the row always closes on twelve — the prototype's
  `Math.max(3, Math.round(…))` can overshoot the grid, and the test sweeps every span and every
  target to prove this one cannot.
- **`reflow(items, spans, manual)`** — what happens to a row when its *members* change. A block
  somebody dragged is *hand-sized* and keeps its span; the others share what is left evenly. A
  lone block takes the row and forgets its hand size. When the hand sizes leave the others fewer
  than `MIN_SPAN` each, the row gives up on them and shares evenly — the honest answer, where the
  prototype overflows.
- **A row that only *reordered* keeps every block's span, and a row that did not change keeps the
  proportional spans `resize` gave it.** That second one is the reason the story's `settle()`
  reflows only rows whose array reference changed: `moveItem` and the add/remove helpers leave an
  untouched row's array alone, which makes "unchanged" free to know. Reflowing every row on every
  change would quietly even out a resize the moment any *other* row moved.

The story keeps the dashboard as one `Board` value — containers, order, spans, the hand-sized set
and row heights — so a drag's snapshot is one assignment and Escape restores all of it. Row height
is a CSS variable on the row (`--row-height`) that the blocks and the add rail read back with
`h-(--row-height)`, not an inline `height` on each block: a runtime value inline would defeat any
responsive override, and there is one variable to change rather than four.

**One departure from the prototype, on purpose.** Its pill follows the cursor along the handle and
shows only on hover. Here it sits in the middle and shows on hover *and* on `focus-visible`, so a
keyboard user can see which handle they are on — a cursor-following pill has nothing to follow
from a keyboard.

## Traps written down

- **Link cards break pointer drags.** An `<a href>` is natively draggable: a pointer drag on it starts
  the browser's own drag, which takes the pointer stream before dnd-kit sees it. And dnd-kit's
  post-drag click suppression is a capture-phase `stopPropagation`, which stops a `<button>`'s
  handler and not an `<a>`'s navigation. The `Kanban` story uses `onClick` cards; a caller who needs
  `href` cards owes them `draggable={false}` and a `preventDefault` when a drag just ended. Same for
  an `<img>` inside a card.
- **A `Sortable.Item` wrapper is `rounded-md`** so the ring follows a card's corners; a block that is
  `rounded-lg` passes it as `className`, or the ring has the wrong radius.
- **`ContentBlock.Content` cannot be the `render` target** of a `Sortable` — its `children` is
  required, and the render element carries none. The kanban wraps the `Sortable` in it instead.
- **A row emptied mid-drag has no height** unless it is given one, so the block that left it
  cannot be carried back. The `Dashboard` story's rows are `min-h-16`; the kanban's columns
  `min-h-24`. A container that can empty owes itself a floor.
- **Do not call another setter inside a `setState` updater.** The dashboard's first `onDragEnd`
  removed empty rows from inside `setContainers((current) => …)`; updaters must be pure. It now
  computes the settled board once with `moveItem` and sets both states from it.
- **A stale Storybook** from an earlier session serves a stale Tailwind scan, and `cursor-grab`,
  `touch-none`, `ring-inset` and the `col-span-*` map were all new to the repo. Restart before
  believing a measurement. This record's numbers were read off a fresh server on a different port.

## Measurements to check if this changes

Resize handle **16px** across, exactly the grid gap, `cursor: col-resize` / `row-resize`,
`role="separator"` with all three value attributes; `aria-valuemax` on a 6/6 row reads 9. Grip
**42 × 32** (the icon-only default `Button`: 16px glyph, 12px padding a side, 1px border);
`cursor: grab`, `touch-action: none`, `aria-roledescription: sortable`, `aria-describedby` resolving
to a node containing "Press Space to pick this up". Lifted item `opacity: 0.5`, `z-index: 10`,
`user-select: none`, a box-shadow ending in `0px 8px 16px` (`shadow-medium`), grip `cursor:
grabbing`. Over target ring **2px** in `surface-border-emphasized`. A shifting item's `transition`
computes to `transform 0.175s cubic-bezier(0.24, 1, 0.4, 1)`. Dashboard spans read from
`gridColumnEnd`: `span 6 / span 6`, `span 4 × 3`, `span 12`, `span 3 × 4`.

## Best practices

Mirrored from the **Best practices** block on `↪ Drag and Drop` (Docs frame `40005289:41938`).
The two are one text in two places — change one and change the other. Where a rule names a thing
only the code has, the canvas says the design decision and the prop is in parentheses here.

**Do**

- Give every item and container a name that says what it is (`label`). The grip is named after it
  and the screen reader reads it; an id is not a name.
- Put the grip beside a clickable card inside the item, never inside it. The item wrapper is what
  lets the two coexist.
- Keep the container state yourself and let the drag report into it: one handler for crossing a
  boundary (`onDragOver`), one for settling (`onDragEnd`), and a snapshot so Escape can put
  everything back.
- Mark a control that must not start a drag — a remove button, a menu trigger — so a press on it
  stays a press (`data-drag-ignore`).
- Give a container that has a limit a `capacity`, and one that can empty a minimum height. A full
  row refuses a fifth block; an emptied row keeps a place to come back to.
- Put a resize handle in the gap, at the gap's size, and never on the last block — it has nothing to
  its right to take from.

**Don't**

- Don't make a draggable card a link. A link is natively draggable and the browser's own drag wins;
  use a click action instead (`onClick`, or take responsibility for `draggable={false}`).
- Don't put a ring on the card inside the item. The drop ring belongs on the item wrapper, where it
  cannot fight the card's focus ring.
- Don't reach for the overlay by default. The item itself moves, on the motion tokens; the overlay
  copy (`DragAndDrop.Overlay`) is only for an item carried out of a scroll container.
- Don't reach for this to reorder a short, static list — a move up / move down pair is smaller, and
  a keyboard user does not have to learn a mode.

One rule from the first draft of this list is not on the canvas, because it is about the tests and
not the component: **don't test a pointer drag** — drive the grip and the handles with the keyboard
and assert the DOM order, the container membership, the rendered spans and what the live region
said. It lives in the "keyboard path only" section above, where it belongs.
