# ContextMenu

The same menu, opened by right-click or long press at the pointer. Mirrors Figma nodes
`40004155:13536` (Context Menu), `40004155:13278` (Context Menu Group) and `40004155:13195`
(Context Menu Item, `Type` action | danger | nested × `State` default | hover | focus | disabled).
Compound API: `<ContextMenu>` + `Trigger` + `Popup` + `Group` + `Item` / `Submenu` /
`CheckboxItem` / `RadioGroup` + `RadioItem`.
**This component is `Menu`, and that is not a figure of speech.** Base UI's `context-menu`
subpath re-exports Menu's parts — `Item`, `Group`, `Popup`, `SubmenuRoot`, `CheckboxItem`,
`Separator` — as literally the same component objects, and `ContextMenu.Root` renders a
`Menu.Root` underneath with a virtual anchor at the cursor. Figma draws the two identically:
the same 32px row with a hidden leading icon and a hidden sub-label, the same group with its
divider and 20px header, the same card on Elevation/Drop Shadow/Medium. So the rows here are
**re-attached, not copied**, and a fix to a menu row fixes both menus at once. Only three things
are new: Root, Trigger, and a Popup that hands the positioner different arguments.
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
**Danger is Figma's word, `destructive` is the code's.** `Context Menu Item` has a third `Type`
that `Menu Item` does not. Menu's `destructive` was built ahead of the file on Astryx's guidance
and the file has since drawn it — but only on this set. One name for one thing across both menus
beats matching the axis, so the prop stays `destructive` and **Figma owes `Menu Item` a `Danger`
type**. Code went first and Figma half caught up; this is the half that is still owed.
**Submenus need nothing.** Base UI types a `SubmenuRoot`'s parent as `menu` even inside a context
menu, so the cursor-anchoring rule never reaches it. Measured with both open: the flyout's left
edge meets the trigger row's right edge to within 0.2px, sits 9.2px over the parent's border box,
and its first item lands level with the trigger row at **0.0px** — Menu's measured offsets,
correct here unchanged.
**`disabled` gives the browser's own menu back**, and that is the right behaviour rather than
swallowing the gesture: measured, the `contextmenu` event comes back with `defaultPrevented`
false. Astryx's `isDisabled` means exactly this.
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
