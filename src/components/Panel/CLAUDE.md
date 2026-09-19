# Panel

A region beside the page that pushes the page over to make room: a details pane, a chat, an
inspector. An in-flow `<aside>` — a `complementary` landmark next to the `<main>` — with no
scrim, no focus trap and nothing inert, so the user works in either and moves between them.
384 wide, resizable from the shell's gap, and under the page on a phone.

Built on 2026-09-19 with `Drawer`, as a pair: the one that **pushes** and the one that
**overlays**. Nathan's framing was exactly that sentence, and it decides everything below.

## Figma

Page **`↪ Panel (In Progress)`** (`40004748:43534`). Two 1440 × 1024 frames, one on the floating
shell (`40005363:61614`) and one on the contained (`40005363:61794`), each with a `Side
Navigation` instance, a `Page` holding a `Top Bar` and an empty `Content`, and a `Panel` frame
(`40005363:61792`, `40005363:61799`) at x=1048, 384 × 1008, holding one centred text that says
"Panel". No component set, no Docs frame, no variants: the page is a layout study, and it says
two things clearly and nothing else.

| What the frames say | Became |
|---|---|
| The panel is a **sibling of the Page**, not inside it | `<AppShell><SideNav/><AppShell.Page/><Panel/></AppShell>` |
| 384 wide, 8 from the Page, the Page's full height | `PANEL_WIDTH = 384`; the shell's `gap-2`; `h-full` |
| A `Surface/Background Primary` card, `rounded-lg`, **in both shell modes** | `panelCard` — always a card, `mode` is not read |

**What the frames do not say, and the code decided.** Whether the card has a border and a
shadow: the frame is a bare `FRAME` with a fill, and the screenshot cannot tell a
`Surface/Border` stroke from none. It follows the contained Page — `border-surface-border`, no
shadow — with ContentBlock's `floating` axis on top (below). The file owes a component set and a
Docs frame; when they land, the border and the shadow are the two classes to check.

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
shell's gap. The **clip** bounds the card while the aside animates, anchored to the entering
edge (`justify-end` for right), so the visible part grows *from* that edge — that is what turns
a width transition into a slide rather than a reveal. The **card** is held at the variable's
full size the whole time so its contents never reflow mid-slide, and it carries the surface.
Do not "simplify" the middle one away: `overflow-clip` on the aside hides the handle.

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
- **The animation clock in the Browser pane is slow.** A screenshot taken a second after opening
  caught the card clipped at its left edge — the slide half-way, the clip box doing its job. Read
  the geometry, or wait it out.

## Measurements to check if this changes

- Card 384 wide (`PANEL_WIDTH`), 8 from the Page, the Page's full height; `rounded-lg` 12,
  border 1; `shadow-low` in a floating framed shell, none in a contained or docked one.
- Handle 8 wide, `left === page.right`, `right === aside.left`; docked, 4 over each side.
- Keyboard: ArrowLeft +8, Shift+ArrowLeft +40, End 640, Home 320.
- Phone (393 × 852): column; aside `top === page.bottom + 8`, width 377, height 320; bar
  `top === aside.bottom + 8`; horizontal handle 8 tall on the seam; ArrowUp +8; document does
  not scroll.
- Header 48 tall, `px-4 py-2`, the × a default-size ghost Button.
- Closed: nothing in the DOM, `page.right === shell.right - 8`.

## Left out

- **A `Panel.Trigger`.** A panel is opened by whatever the application decides — a bar button, a
  menu item, a row — and none of those is *its* trigger the way a Dialog's is. `open` /
  `onOpenChange` is the API; the bar button in the stories carries `aria-pressed`.
- **Persisting the width.** `onWidthChange` fires every step of a drag; where it goes is the
  application's, SideNav's arrangement.
- **A collapsed rail-style state.** A panel is open or it is gone.
- **Figma.** The set and the Docs frame are owed; the border and shadow assumptions above are
  what to check when they land.

## Best practices

Written here first; the `↪ Panel` page has no Docs frame yet to mirror.

**Do**

- Reach for a Panel when the user works in it *and* the page at the same time — details beside a
  list, a chat beside a document. If the page should wait, it is a Drawer.
- Write it after the Page for `side="right"`, before it for `side="left"`: where it is in the DOM
  is where it lands, on a desktop and on a phone.
- Give the shell a `MobileNav` when the app has a phone layout; the panel stacks under the page
  and above the bar on its own.
- Give it an `aria-label` that says what it holds — it names the landmark and the resize handle.

**Don't**

- Do not put a second scrolling region inside `Panel.Body`; the body is the scroll region.
- Do not open it with `defaultOpen` and expect focus to move; a panel that starts open takes
  nothing from the page.
- Do not write your own breakpoint around it; the shell owns the one line.
