# ContextMenu

The same menu, opened by right-click or long press at the pointer. Mirrors Figma node
`40004155:13536` (Context Menu) — which is a frame around Menu's own `Menu Group` and `Menu Item`,
the file having no context-menu-specific row of its own.
Compound API: `<ContextMenu>` + `Trigger` + `Popup` + `Group` + `Item` / `Submenu` /
`CheckboxItem` / `RadioGroup` + `RadioItem`.
**This component is `Menu`, and that is not a figure of speech.** Base UI's `context-menu`
subpath re-exports Menu's parts — `Item`, `Group`, `Popup`, `SubmenuRoot`, `CheckboxItem`,
`Separator` — as literally the same component objects, and `ContextMenu.Root` renders a
`Menu.Root` underneath with a virtual anchor at the cursor. So the rows here are **re-attached,
not copied**, and a fix to a menu row fixes both menus at once. Only three things are new: Root,
Trigger, and a Popup that hands the positioner different arguments.
**Figma is built the same way, and now says so.** It used to carry its own `Context Menu Item`
(`40004155:13195`) and `Context Menu Group` (`40004155:13278`) sets, drawn identically to Menu's
down to the hidden icon slot and the 20px header. Both were retired the day this landed and
`Context Menu` now instances `Menu Group` and `Menu Item` directly. Worth knowing if you meet
those node ids in an old commit message: they are gone, not moved, and the change was a
simplification in the same direction the code had already taken. Two independent readings of the
same component arriving at one shared row is the strongest evidence the call was right.
**The shared popup recipe moved to `Menu/styles.ts`** for that reason — Select, Combobox and
Toast already use that filename for the same job. `item`, `indicatorBox` and `ItemLabel` stayed
in `Menu.tsx`: ContextMenu reaches them through `Menu.Item` and friends, so moving them would
have been churn in a settled file.
**`ContextMenu.Popup` cannot be `Menu.Popup`, for exactly one reason.** Base UI's positioner
branches on `parent.type === 'context-menu'` and hugs the pointer — but **only when `side` is
left undefined** (`MenuPositioner.js`: `if (!side && align !== 'center')` → `sideOffset: -5`,
`alignOffset: 2`). `Menu.Popup` defaults `side` to `bottom` and `sideOffset` to 4, which skips
that branch and parks the menu 4px *below* the click instead of at it. So every positioning prop
here defaults to `undefined` and Base UI owns the numbers rather than this file copying them.
Measured: right-click at (548, 160) put the popup's top-left at exactly +2, −5.
**The one piece of ARIA to patch — Tooltip's situation again, and Menu's inverted.** Menu's
record says "no ARIA to patch"; that is true of Menu and false here. `MenuRoot.js:350` names a
menu popup with `aria-labelledby: activeTriggerElement?.id`, and a context menu trigger never
registers as a trigger — it only sets the anchor — so **`aria-labelledby` measures as `null` and
the `role="menu"` arrives with no accessible name at all.** `Popup` takes a `label`, default
`'Context menu'`, which is Astryx's default wording for the same patch. It is spread **only when
set**, never as `undefined`, because forwarding an `aria-*` prop as `undefined` deletes what Base
UI computed. A submenu is unaffected and correctly keeps `aria-labelledby` to its trigger row.
**`destructive` is Figma's `Type=Danger`, and that debt is settled.** It was built here first,
on Astryx's guidance, against a `Menu Item` that had only Action and Nested. Figma then drew
Danger onto the retired `Context Menu Item` set only — half a catch-up — and, when that set was
folded into `Menu Item`, onto `Menu Item` itself (`40004149:7376` and its hover/focus/disabled
siblings, on `Content/Danger` `#c10006`, which is what `text-content-danger` already painted).
**Nothing in the code changed for any of it**, which is the point: the prop stays a boolean
rather than becoming a third `type`, because that is how it reads at a call site, and the axis
and the prop now name the same thing. Accordion's clean-closure pattern, on a shorter clock.
**Submenus need nothing.** Base UI types a `SubmenuRoot`'s parent as `menu` even inside a context
menu, so the cursor-anchoring rule never reaches it. Measured with both open: the flyout's left
edge meets the trigger row's right edge to within 0.2px, sits 9.2px over the parent's border box,
and its first item lands level with the trigger row at **0.0px** — Menu's measured offsets,
correct here unchanged.
**`disabled` gives the browser's own menu back**, and that is the right behavior rather than
swallowing the gesture: measured, the `contextmenu` event comes back with `defaultPrevented`
false. Astryx's `isDisabled` means exactly this.
**The focus ring showed on hover, and it was this component that exposed it.** Base UI focuses the
row you point at; Chrome decides `:focus-visible` for a scripted `.focus()` by asking what the last
user interaction was. A right-click on a `<div>` trigger focuses nothing, so after opening a context
menu **focus is still on `<body>`** — measured — no pointer interaction has ever moved it, and every
scripted focus afterwards reads as keyboard. Result: a full keyboard ring under the cursor on every
hover. `Menu` has the identical defect and only shows it after a keypress (open with Tab then
ArrowDown, then hover), which is why the fix is in the shared row recipe rather than here:
`focusRingUnhovered` scopes the ring off the hovered row. The row is not left unmarked —
`data-highlighted` paints it — and arrowing away from a parked mouse rings the row you moved to.
**The suite cannot test it, and the story says so instead of pretending.** A synthesized hover
dispatches mouse events but never moves the real pointer, so CSS `:hover` stays false and the bug
does not reproduce in the runner — an assertion on the painted ring would have passed for the wrong
reason. `Open` guards the two halves that *are* checkable: the row carries the scoped utility, and
the ring still paints when nothing is hovered, which is only true if Tailwind emitted a rule for
`not-hover` at all. Both were verified by breaking them on purpose.
**There is no keyboard way in, and there should not be.** Base UI renders the trigger as a plain
`<div>` with no `tabIndex`; giving it one would make an interactive element with no role. Both
Base UI and Astryx say the same thing instead — a context menu must never be the only route to
an action. `InContext` is built to show it: the same items sit on an ellipsis `Menu` beside the
row, and the trigger `render`s the row itself so the Menu key and Shift+F10 fire `contextmenu`
on something already focusable. A `Menu` nested inside a `ContextMenu.Trigger` works: Base UI
guards for that case explicitly, and the ellipsis menu measures as an ordinary Menu — named by
its button, 4px below it, aligned end.
Left out: `Backdrop` (Base UI already renders an internal one to catch the outside press, and
Figma draws none), `Arrow` (no anchor edge to point at), `LinkItem` (Menu's reason, unchanged).
**Story trap, and it is worse than Menu's.** A closed menu has no popup in the DOM, so axe would
pass by looking at nothing — Toast's lesson. Menu solved it with `<Menu.Root open>`; that does
**not** work here, because `ContextMenuRoot` seeds its anchor as a zero-size rect at (0, 0) with
`positionMethod: fixed`, so a force-open context menu renders in the viewport corner over the
page. `Open` therefore has **the library's first `play` function**, firing a real right-click.
That ordering was not assumed: an `<img>` with no alt was planted inside the open popup and the
suite failed with `image-alt`, which proves both that axe runs *after* `play` and that it reaches
inside the portal. Remove that story and the a11y coverage of this component goes to zero
silently.
**A `render` target must spread its props.** The stories' `Surface` helper was written without
`...props` first and the menu simply never opened: `render` hands the element Base UI's own
`onContextMenu`, its ref and its data attributes, and a component that drops them is a trigger
that never triggers. Nothing errors — it just does nothing, which is the part that costs time.
