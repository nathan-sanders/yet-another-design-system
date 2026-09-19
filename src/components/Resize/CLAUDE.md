# Resize

One component, `ResizeHandle`: the strip you drag to change a size. Between two dashboard blocks
it is the 12px gap itself and sets the left block's column span; under a row it sets the row's
height; beside the application rail it is the shell's 8px gap and sets the rail's width. A
focusable `separator`, not a button, with a pointer path on capture and a keyboard path the
stories test.

## Figma

Page **`↪ Resize`** (`40005293:55834`), made on 2026-09-18 when Nathan moved the set off the
Drag and Drop page. The set kept its id.

| Thing | Node | Became |
|---|---|---|
| Resize Handle (`Orientation` vertical \| horizontal × `State` default \| hover \| focus) | `40005289:41760` | `ResizeHandle` |
| Docs frame (header, Light + Dark preview, Do / Don't) | `40005293:55859` | this record's Best practices |
| Components section | `40005293:55874` | — |

What the file draws: the strip is `width/w-4` across (or `height/h-4`), a
`w-1 × h-10` pill in `Surface/Border Emphasized` (`w-10 × h-1` horizontal), `Hover` fills the
strip with `Surface/Overlay Subtle`, and `Focus` is the shared `Focus Ring` instance. The pill is
at opacity 0 in `Default`, so the resting variant is invisible on the canvas — which is also what
the code renders. The file has one width; the code's is the gap it sits in (below), and since the
dashboard gutter went to 12px the code's default is `w-3`. The file still draws 16 and is owed
the change.

## Why it left DragAndDrop

It shipped on 2026-09-18 inside `DragAndDrop`, because the composable dashboard that asked for it
needed both a drag and a resize, and moved out the same day. **A resize is not a drag.** `Table`
had already resized columns with no drag anywhere near it (its own pixel-only grip), and the next
caller — `SideNav`'s rail inside an `AppShell` — has none either. Three callers, two of which would
have imported the drag foundation to get a separator. The Figma file made the same call from the
other side, giving the set a page of its own; the code followed.

`DragAndDrop` now imports it like any other caller. The one thread still tying the two: the
handle always carries **`data-drag-ignore`**, which is `useSortableItem`'s signal that a press on
this element is not the start of a drag. Outside a drag root the attribute is inert, so it is
unconditional rather than a prop — a caller should not have to know the dashboard exists.

## Decisions

**A focusable `separator`, not a button.** A button does one thing; this does a continuous one.
Being focusable makes `separator` a widget role, which obliges `aria-valuenow` / `valuemin` /
`valuemax` — axe checks for exactly that, and a screen reader has nothing to say without them.
`aria-valuetext` is the caller's to phrase: "6 of 12 columns", "224 pixels", "Collapsed".

**It reports a value in the caller's unit, not pixels.** The column handle reports spans, with
`unit` a function that measures one twelfth of the row when the drag starts; the row and rail
handles report pixels with `unit` left at 1. The arithmetic that snaps a value belongs with the
caller, where it is tested — `spans.ts` in node, the rail's clamp in its story.

**A handle is the gap it sits in, at the gap's size.** Between dashboard blocks that is 12 and
`w-3` is the default; beside the rail the shell's gap is 8 and the rail passes `w-2`. A handle
wider than its gap is a handle lying over something; narrower, and the gap has a dead strip in it.
Where there is no gap — a docked rail, a table column — it straddles the seam instead, half over
each side, which is what `Table`'s grip has always done.

**The keyboard path is the tested one.** Arrows step, Shift steps `largeStep`, Home and End go to
the ends, and `preventDefault` stops the arrows scrolling the region the handle is in. A synthetic
pointer drag in a browser runner is flaky in a way that teaches nothing; the stories drive the
keyboard and assert the size reached layout, and pointer drags are checked by hand.

**`onResizeStart` / `onResizeEnd` bracket a pointer drag, and only that.** A keystroke is one
resize, complete in itself; a drag is a stream of them. A caller whose size is on a CSS transition
— the rail's width eases over `duration-medium` when it collapses — needs to know when the stream
starts and stops so it can switch the transition off for its length: a 410ms ease trailing the
pointer reads as a broken handle. Not fired for the keyboard, where the ease is wanted.

**Pointer capture is guarded.** `setPointerCapture` throws for a pointer that is not active, which
a real press never is and a synthetic one (`userEvent.pointer`) always is. Without capture the
drag still works while the pointer stays on the strip, which is all a test needs; with the throw,
the handler died before `onResizeStart` and the lifecycle could not be tested at all. The release
is guarded the same way, and `onResizeEnd` runs regardless — a caller left with its transition off
is worse than a capture left to expire. `pointercancel` ends a drag like `pointerup`.

**The pill follows the pointer along the strip.** One CSS custom property, `--pill-offset`,
written straight to the element on `pointermove` — a mousemove is not a reason to render — and
read back by `top-(--pill-offset,50%)`. Clamped half a pill from either end. On `focus-visible` the
property is unset and the fallback centres it, so a keyboard user can see which handle they are on.
Reading the pill's computed position mid-slide reads the wrong number: assert the property, then
`waitFor` the position.

**`sized` says which side of the handle the block is on, and the arrow moves the separator.**
Added 2026-09-19 for `Panel`, whose handle sits on its *near* edge with the panel on the far
side: dragging toward the start has to grow it. Rather than a second component or an inverted
`unit`, one prop — `sized: 'before' | 'after'`, default `before`, so the rail, the dashboard and
every existing caller are byte-identical. The keyboard rule that fell out of it is worth
stating: an arrow key moves the **separator** in the arrow's direction, never "the value up",
so ArrowLeft grows a right-hand panel and shrinks the rail. That is what a separator's arrows
mean to a screen-reader user, and the `Sized after` story asserts it.

## Traps

- **A bare `userEvent.pointer` is a fresh instance every call.** A press in one call and a release
  in the next dispatches no `pointerup` at all — there is nothing pressed to release. Use one
  `userEvent.setup()` instance for both halves of a drag. The Resize `Keyboard` story does.
- **`git checkout <path>` on a file staged as a rename restores the *staged* content**, which is
  the pre-edit file. Every edit made after the `git mv` was lost once this way, and the tests
  failed for reasons that made no sense until the served source was read back.

## Measurements to check if this changes

Dashboard handle **16 × row height**, `cursor: col-resize`; row handle **16 tall**, `row-resize`.
Rail handle **8 wide**, `left` equal to the rail's `right` and `right` equal to the page's `left`
in a framed shell; centred on the rail's edge docked. Panel handle the same 8, mirrored:
`right` equal to the panel's `left`, and ArrowLeft grows it. `role="separator"` with all three value
attributes. Pill `4 × 40`, `--pill-offset` set on hover and cleared on leave. `onResizeStart` once
per press, `onResizeEnd` once per release, neither on a keystroke.

## Left out

- **`Table`'s grip is still its own component.** `Table/ResizeHandle.tsx` is pixel-only, drawn as
  a 1px line rather than a pill, with `aria-valuemax` a synthetic `min × 10`, and its drawing is
  Table's Figma node, not this set. Folding it in is a Table change with its own measurements, and
  the record here is the place that says the debt exists.
- **No `size` prop.** The width is the gap's, and the gap is the caller's; `className` carries it
  (`w-2`), as it carries the positioning.

## Best practices

Mirrored to the **Best practices** block on `↪ Resize` (Docs frame `40005293:55859`). The two are
one text in two places — change one and change the other. Where a rule names a thing only the
code has, the canvas says the design decision and the prop is in parentheses here.

**Do**

- Put the handle in the gap, at the gap's size. The 12px between dashboard blocks, the 8px beside
  the rail — never wider than the space it sits in, and never on the last block in a row, which
  has nothing to its right to take from.
- Name what it resizes (`label`): "Resize Revenue", "Resize Main". The name is what a screen reader
  hears, and two handles with the same name cannot be told apart.
- Say the value in the user's words (`valueText`): "6 of 12 columns", "224 pixels", not a bare
  number.
- Switch the size's transition off for the length of a drag (`onResizeStart` / `onResizeEnd`). An
  ease that trails the pointer reads as a broken handle; keep it for the keyboard, where a step
  should ease.
- Give every size a floor and a ceiling (`min` / `max`), and let the handle clamp to them. A panel
  dragged to nothing is a panel somebody cannot find again.

**Don't**

- Don't reach for a handle to reorder or move something. Sizing is continuous; moving is Drag and
  Drop.
- Don't make the handle a button. It does a continuous thing, and a `separator` with a value is
  what a screen reader can read and step.
- Don't put a handle on a size that has nothing to give — the last block in a row, a collapsed
  rail's 56px. Where a collapsed thing can still be resized, let the resize open it first.
