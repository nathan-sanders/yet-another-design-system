# Panel

A region beside the page that pushes the page over to make room: a details pane, a chat, an
inspector. An in-flow `<aside>` — a `complementary` landmark next to the `<main>` — with no
scrim, no focus trap and nothing inert, so the user works in either and moves between them.
384 wide, resizable from the shell's gap, and under the page on a phone.

Built on 2026-09-19 with `Drawer`, as a pair: the one that **pushes** and the one that
**overlays**. Nathan's framing was exactly that sentence, and it decides everything below.

## Figma

Page **`↪ Panel`** (`40004748:43534`), which was `(In Progress)` until 2026-09-19. It began as two
1440 × 1024 layout frames — one on the floating shell (`40005363:61614`), one on the contained
(`40005363:61794`) — each with a `Side Navigation`, a `Page` and a bare `Panel` frame
(384 × 1008, one centred text reading "Panel") beside it. That was the whole brief, and it said
two things clearly: the panel is a **sibling of the Page**, and it is a 384-wide card 8 from it,
in both modes. The code was built from those two facts, and the page was drawn out from the
code the same day.

| Thing | Node | Became |
|---|---|---|
| Panel (`Floating` False \| True) | `40005378:45634` | `Panel`, its `floating` prop; `Content` slot = `Panel.Body`'s room |
| Panel instances in the two layout frames | `40005378:45648` (floating), `40005378:45664` (contained) | the `Floating` and `InContext` stories |
| Phone layouts, 393 × 852 | `40005382:1401` (floating), `40005382:1519` (contained) | the `Phone` story: Page, then the Panel full-width at 320, then the bar |
| `Panel` boolean on the App Shell set | `Panel#40005385:0` on `40005265:10346` | a Panel instance in all twelve shell variants, off by default; see the AppShell record |
| Docs frame (header, Light + Dark preview, 5 Do / 3 Don't) | `40005378:45680` | this record's Best practices |
| Components section (now 2416 tall: the set, then the two stacking frames) | `40005378:45840` | — |
| `Panel Stacking`, three `Floating=True` instances stepped 12 | `40005373:62883` | the stack: a nested `Panel`'s geometry, see **Stacking** |
| `Panel Stacking (Phone)`, the same at 377 × 320 with the step upward | `40005414:528` | the `Stacked, phone` story |

**What the set draws.** Each variant is a 384 × 1008 vertical frame on `Surface/Background
Primary` inside a 1px `Surface/Border` (`INSIDE`, `border-width/border`) at
`border-radius/rounded-lg`, `clipsContent` on — the code's `overflow-clip` card. `Floating=True`
carries the `Elevation/Drop Shadow/Low` effect style. The header is an instance of
`_Content Block Header` with its top and bottom padding rebound to `spacing/3` and its
min-height to `height/h-14` — the 56 the code's `height: 'bar'` is — and the Button in its
Actions slot swapped to the `x` icon and named `Close`. Below it a `Content` frame, `FILL` both
ways, padded `0 / spacing/4 / spacing/4 / spacing/4`, bound to the set's one `Content` SLOT
(`stretchChildOnInsert` on). **Every dimension is a variable**, Nathan's rule for the build.

**The phone frames are the App Shell's `Navigation=Mobile` variants, detached, with a Panel
put between the Page and the bar.** An instance of `40005300:6252` / `40005300:6364`,
`detachInstance()`d so a sibling could be inserted — a slot takes content, not a sibling — and
the Panel instance set `FILL` across and 320 tall. The geometry came out as the code measures it
with nothing adjusted: Page 8 → 452, Panel at 460 (the frame's gap), 377 × 320, bar at 788.
Floating in the floating shell, flat in the contained one, the shell's default either way.

**What it cannot draw.** `side`, `resizable`, the width range and the split's *resizing*. A Figma
property is a variant, a boolean, a text or a swap, and none of those is a number or a
breakpoint; the layout frames above show the desktop arrangement and the record carries the
rest. The header's title is the nested instance's own `Header Text` property, because a nested
instance's property cannot be bound to an outer one.

## Decisions

**It pushes; `Drawer` overlays — and that is a difference in what the user is doing.** A drawer
is a modal moment: the page waits until it is dismissed. A panel is a second place to work that
sits beside the first. So the panel is non-modal all the way down — no scrim, no focus trap,
nothing `inert`, the page stays a live `<main>` and the panel is a live `<aside>`. Base UI's own
guideline draws the line from the other side: "a panel that slides in from the edge of the
screen and doesn't need gesture support is a positioned Dialog", which is to say a Panel is not
a Drawer with the scrim off. It is a layout region.

**Not a Base UI component, and two candidates were checked.** `Collapsible` with its Root
rendered as the aside: the Root stays in the row when the panel is closed, an empty flex item
the shell's `gap-2` still counts, and hiding it on `data-closed` kills the exit transition. A
non-modal `Dialog` portalled back into the row through `Portal`'s `container`: `Dialog.Popup`
throws without a Portal, so it would be `role="dialog"` machinery — `aria-modal`, nested-dialog
counters, outside-press tracking — bolted onto a landmark, plus two `display: contents` wrappers
in the flex row. What a panel needs from a primitive is *mount with an entrance, unmount after
an exit*, and that is `usePresence` in `src/lib/presence.ts`, ~50 lines in Base UI's own
`data-starting-style` / `data-ending-style` vocabulary. Closed, the panel renders **nothing** —
which is what makes "no gap when closed" true, and the Playground story asserts it.

**The slide is the width.** An in-flow box cannot translate in from the edge; what it can do is
grow from 0 to 384 while the page eases over, which *is* what "pushes the content" looks like.
`transition-[width,height,margin] duration-medium ease-standard`, the rail's transition. The
presence hook forces a reflow after inserting the element in its starting styles — not a
`requestAnimationFrame`, which never fires in a hidden tab (the Nav record's trap) — so the
change to the resting width is a change the transition can see.

**Three boxes, and each has one job.** The **aside** is the animated box and the handle's
positioning parent; it never clips, because the handle is translated *outside* it into the
shell's gap. The **clip** bounds the card *while the aside animates* — `overflow-clip` only
while `usePresence`'s status is not `open`, passed to the recipe as `transitioning` rather
than read off a `group`, because a nested aside is a descendant of the root's and a group
variant would match the wrong level — so at rest nothing clips and the card's shadow paints.
The **card** is held at the variable's full size the whole time so its contents never reflow
mid-slide, and it carries the surface. Do not "simplify" the middle one away: `overflow-clip`
on the aside hides the handle. (A fourth, the **content** column, arrived with stacking; see
below.)

**The card is anchored to the near edge, and that is the difference between a slide and a
reveal.** The first build anchored it to the far edge (`justify-end` for right): the card's left
edge then sat at its final x from the first frame and the aside's growing edge uncovered it —
which read, in Nathan's words, as "it is just there and the page content slides over to show
it". Anchored to the aside's *near* edge (`justify-start`), the card's leading edge is wherever
the aside's leading edge is, so it travels in from the viewport edge while the rest hangs
off-screen under the clip: measured at 1016 → 738 → 650 → 632 over the transition, on a 1024
viewport. Same width transition, opposite anchor, and only one of them is a panel pushing the
page. On a phone the anchor is the top edge, so it travels up from the bottom.

**The shell's gap eases in with the width.** Inside a framed shell the 8px gap would snap in a
frame before the width started to move; a `-ml-2` on the starting and ending frames, on the
same transition, keeps the page still until the panel is actually there. Compound variant on
`side` × `framed`, and only there.

**ContentBlock's default surface, with its `floating` axis.** Nathan's call: "similar styling
options as the content block, just the default with the options of floating or not". So
`bg-surface-background-primary border-surface-border`, the title on `text-content-emphasized`,
no `subtle` or `accent` — a panel is a region of the page, not a bento cell — and `floating`
adds `shadow-low`, ContentBlock's exact variant. Its default is the shell's, the rail's rule:
`floating ?? (shell ? shell.mode === 'floating' && shell.frame : false)` — lifted in a floating
framed shell, flush in a contained or docked one, flat on its own. An explicit prop wins; the
`Floating` and `Floating, overridden` stories assert both.

**Focus goes in on open, comes out on close, and never moves for `defaultOpen`.** Opening a panel
is done *to work in it*, so focus moves to the landmark itself (`tabIndex={-1}`, Dialog's
spelling — a screen reader announces "Details, complementary") or to `initialFocus`. A panel that
is already there when the page loads was not opened by anybody, and stealing focus from the page
on load is the mistake `defaultOpen` invites — Popover's rule, and the `Resizable` story's last
step. On close, focus returns to what had it when the panel opened, *only if* focus is inside the
panel at the time — closing a panel the user was not in moves nothing. A Menu item that opened
the panel is unmounted by then, which is what `finalFocus` is for; the `InContext` story
exercises exactly that shape.

**Escape closes it from inside, and only from inside.** The WAI-ARIA non-modal pattern and every
IDE side panel. It is a React `onKeyDown` on the aside, so it never fires for focus elsewhere on
the page, and a Menu or Popover inside the panel has already stopped its own Escape (Base UI
calls `stopPropagation` in its dismiss hook) — a Combobox that only `preventDefault`s is caught
by the `defaultPrevented` guard.

**Resizable from the seam, the rail's way, mirrored.** `resizable` draws a `ResizeHandle` that is
exactly the shell's 8px gap (`w-2`, `-translate-x-full`) on the panel's *near* edge, straddling
the seam when docked — SideNav's two lines with the signs flipped. The panel is on the far side
of the line from the rail's point of view, so it passes **`sized="after"`**, the prop this
component added to `ResizeHandle`: dragging toward the start grows it, and ArrowLeft grows a
right-hand panel, because the arrow moves the *separator* and the value follows. Step 8, Shift
40, 320–640, `aria-valuetext` "384 pixels" — the rail's numbers.

**A `navigation="top"` shell stacks it at every width.** A column has no "beside the page", so
the panel reads `navigation` off the shell's context and, in a top shell, takes the phone's
arrangement on a desktop too: `stacked` on the three recipes overrides the `md:` classes at
their own prefix, and the handle swap is `hidden` / `flex` outright instead of breakpoint-scoped.
Found when the Figma set gained its `Panel` boolean and the four `Navigation=Top` variants needed
an answer the code did not have. The `Top navigation, keyboard` story measures it.

**Below 768 it is under the page, and the handle turns horizontal.** Nathan's call: "split the
available space vertically and you can drag the resize handle to make the panel or page content
bigger". There is no room for two columns on a phone, so the shell turns into a column — the
panel carries a `data-panel` marker and the shell reads it in CSS,
`max-md:has-data-panel:flex-col`, exactly `MobileNav`'s mechanism; the breakpoint is written in
the shell once — the panel takes the full width and a **height** instead (`--panel-height`,
320 by default, 160–560), and it slides up from the bottom. Two `ResizeHandle`s are rendered and
one is `display: none` (`max-md:hidden` / `hidden max-md:flex`): ResponsiveNav's CSS-only swap,
because a panel paints on first load and a `matchMedia` hook would flash. A `display: none`
element is out of the accessibility tree, so the two share one label. **DOM order is layout
order**: a right panel written after the Page lands under it, above a bottom `MobileNav` bar; a
left panel written before the Page lands *above* it on a phone, and that is the price of DOM
order being tab order, paid on purpose rather than fixed with `order-*`.

**A panel inside a panel stacks — Base UI's nested drawers, for a region.** Nathan drew
`Panel Stacking` on 2026-09-19 and asked for what Base UI gives `Drawer` for free: write a
`Panel` inside a `Panel.Body`, opened by a control in the parent, and it slides in over its
parent. The mock is three 384-wide cards where each level behind the front one sits **12px
(`spacing/3`) toward the page and 12px in from each end** — the widths never change and
nothing scales, which is what separates it from Base UI's demo (a `scale()` per level). His
one addition for phones: the panel is under the page there, so the stack peeks out *above*
the front card. The vocabulary mirrors Base UI's so the two records read alike:
`--nested-panels` / `data-nested-panel-open` on a panel with open descendants, `data-nested`
on a nested one.

*How it is built.* Reading a `PanelStackContext` is the whole detection — every panel
provides one, only a nested panel finds one. A nested panel **portals into the root's
aside** (`createPortal`), so the stack is one region and the root's width is what pushes the
page: the root aside is `w-[calc(var(--panel-width)+var(--panel-stack))]`, where
`--panel-stack` is `--nested-panels × spacing/3`, and the root's *clip* pads by the same
number so the in-flow card shrinks at the ends without the card recipe changing. Because the
aside is wider by `12N` while the card stays `--panel-width` anchored to the near edge, the
root card lands `12N` from the viewport on its own. A nested aside is `absolute`, positioned
`--panel-stack` in from the far edge and each end (`panelNested`), sized by the root's
variables — **inherited**, which is why a nested panel writes no inline `--panel-width`, and
why `side`, `resizable`, `width` and `height` are ignored on it. Its entrance is the root's
one level in: the width (the height, on a phone) goes 0 → variable with its own clip anchored
the same way, so the card travels in from the viewport edge over its parent. The inset eases
too, so a level stepping back moves on the same clock as the one sliding in over it.

*Counting.* Each level keeps a `Set` of the open panels in front of it and forwards every
report to the level behind, so the root counts the whole chain and each level counts what is
in front of it. Reported as `open`, not `mounted`: the parent starts coming forward the
moment the front panel starts leaving, on the same duration. The root's aside is held in
**state** through a callback ref, because a `defaultOpen` chain renders the root and its
nested panel in one commit and a `RefObject` is null until after it; a nested panel's
presence waits on the container (`usePresence(open && container !== null)`), or it would sit
in `starting` forever with nothing to mount into.

*The covered parent.* Its surface and shadow stay — that is the 12px that peeks — and its
content column (`panelContent`, the fourth box, which exists for this) fades to 0 and is
`inert`, so the × and the fields under the front card are out of the tab order. **`inert` is
set by the nested panel, imperatively, in a layout effect — not rendered off the parent's
count**, and the order on close is what forces it: the nested panel's focus-out effect runs
in the commit its `open` turns false, the parent's re-render (the one that would drop
`inert`) comes after that commit's effects, and `focus()` on an element inside an inert
subtree does nothing. `flushSync` in an effect was the first idea and is refused there;
un-inerting in a layout effect *before* the passive focus-out is deterministic. Escape closes
only the front panel because the nested handler prevents default on the way and the parent's
handler already returned on `defaultPrevented` — React bubbles through the portal once.

*The peeking edge is a way back.* Nathan asked the day it landed, and it is the drawer's
behavior seen from the panel's side: a click on a covered card closes every panel in front of
it, deepest first — one level back from the card just behind, all the way back from the root's.
Each `report` carries the child's `close`, so a level holds a `Map` of what is in front of it
rather than a `Set`. The guard is DOM containment: the panels in front are React children of
this card's content (their clicks bubble through), but DOM children of the *root's* aside, so
`currentTarget.contains(target)` is false for a click inside them. The card is `cursor-pointer`
while covered and nothing else — it is a pointer shortcut; the front panel's × and Escape stay
the keyboard path — and focus lands on the clicked level's landmark on its own, because a
mousedown on a non-focusable element focuses the closest focusable ancestor and the aside is
`tabIndex={-1}`.

**`aria-label` is required.** It names the landmark — a page can have several `complementary`
regions — and it names the handle ("Resize Details"), SideNav's reason.

## Traps

- **Compile the stacked variants before trusting them.** `md:data-[starting-style]:w-0`,
  `max-md:has-data-panel:flex-col` and the compound negative margins all read correctly in
  Tailwind 4.3; a version that could not parse one would drop it silently and the slide would
  become a pop. The stories measure the settled numbers, not the motion.
- **Measuring width mid-transition needs `waitFor`.** The rail's stories already do this; the
  panel's do too. A number read the tick after `ArrowLeft` is the old one.
- **The role query already hides the hidden handle.** Testing Library's `getAllByRole` skips
  `display: none`, so on a phone it finds one separator, not two; count the DOM with
  `querySelectorAll('[role="separator"]')` if the count is the claim.
- **A `Panel.Body` that scrolls with nothing focusable in it** trips axe's
  `scrollable-region-focusable`. The stories keep a control inside, as Dialog's `Scrollable` does.
- **The animation clock in the Browser pane is slow, and stops when the pane is hidden.** A
  screenshot taken a second after opening caught the card clipped at its edge — the slide
  half-way, the clip box doing its job. To see the slide as numbers, scrub `getAnimations()`
  to a `currentTime` and read the card's `left`; `requestAnimationFrame` never fires in a hidden
  pane, so sample with timers.
- **A story that opens, resizes and closes itself on load reads as an animation bug.** Every
  state-changing test lives in a `…, driven` / `…, keyboard` twin sharing the demo's render
  function, DragAndDrop's arrangement; the demos sit still.
- **The nested clip must not pad.** The first stacked build padded every level's clip by its
  stack and the middle card came out 12px in *twice* — once from the aside's inset, once from
  the clip. Only the root's card is in-flow; only the root's clip carries the inset.
- **A `defaultOpen` chain reports up after it mounts.** The root aside is 320 tall for a
  commit and eases to 344; a phone story that reads the height synchronously reads 320.

## Measurements to check if this changes

- Card 384 wide (`PANEL_WIDTH`), 8 from the Page, the Page's full height; `rounded-lg` 12,
  border 1; `shadow-low` in a floating framed shell, none in a contained or docked one.
- Handle 8 wide, `left === page.right`, `right === aside.left`; docked, 4 over each side.
- Keyboard: ArrowLeft +8, Shift+ArrowLeft +40, End 640, Home 320.
- Phone (393 × 852): column; aside `top === page.bottom + 8`, width 377, height 320; bar
  `top === aside.bottom + 8`; horizontal handle 8 tall on the seam; ArrowUp +8; document does
  not scroll.
- Header 56 tall — the TopBar's height — `px-4 py-3`, the × a default-size ghost Button.
  (ContentBlock's stays 48 on 8; the shared recipe's `height: 'bar'` is this one.)
- Closed: nothing in the DOM, `page.right === shell.right - 8`.
- Stacked, two levels: root aside 384 + 24 wide, `--nested-panels` 2; front card
  `right === aside.right`, full height; middle card 12 in, 12 down, 24 shorter; root card 24 /
  24 / 48; page 24 further left; parent content `inert`, opacity 0. Phone: aside 320 + 24 tall,
  front card at the bottom full width, middle 12 up and 12 in each side, root 24.

## Left out

- **A `Panel.Trigger`.** A panel is opened by whatever the application decides — a bar button, a
  menu item, a row — and none of those is *its* trigger the way a Dialog's is. `open` /
  `onOpenChange` is the API; the bar button in the stories carries `aria-pressed`.
- **Persisting the width.** `onWidthChange` fires every step of a drag; where it goes is the
  application's, SideNav's arrangement.
- **A collapsed rail-style state.** A panel is open or it is gone.

## Best practices

Mirrored from the **Best practices** block on `↪ Panel` (`40005378:45680`) in Figma; the
fifth Do card (`40005414:45702`) was added with stacking on 2026-09-19.
The two are one text in two places — change one and change the other.

**Do**

- Reach for a Panel when the user works in it *and* the page at the same time — details beside a
  list, a chat beside a document. If the page should wait, it is a Drawer.
- Write it after the Page for `side="right"`, before it for `side="left"`: where it is in the DOM
  is where it lands, on a desktop and on a phone.
- Give the shell a `MobileNav` when the app has a phone layout; the panel stacks under the page
  and above the bar on its own.
- Give it an `aria-label` that says what it holds — it names the landmark and the resize handle.
- Open a follow-up step as a Panel written inside the first one; it stacks over its parent, 12px
  in, and the page moves over by the same 12. The edge that peeks out is a way back.

**Don't**

- Do not put a second scrolling region inside `Panel.Body`; the body is the scroll region.
- Do not open it with `defaultOpen` and expect focus to move; a panel that starts open takes
  nothing from the page.
- Do not write your own breakpoint around it; the shell owns the one line.
