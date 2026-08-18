# Menu

A list of actions in a popup, opened by a button. Mirrors Figma nodes
`40004146:5575` (Menu), `40004146:5285` (Menu Group), `40004145:4024` (Menu Item,
`Type` action | nested × `State` default | hover | focus | disabled), `40004146:4924` and
`40004146:5107` (its checkbox and radio items), plus the composed examples at `40004145:3915`.
Compound API: `<Menu>` + `Trigger` + `Popup` + `Group` + `Item` / `Submenu` / `CheckboxItem` /
`RadioGroup` + `RadioItem`.
**Ninth Base UI component, and the second that portals** — it copies the pattern Tooltip set,
and is the component Tabs' overflow `TabMenu` has been waiting on.
**`Menu.Popup` swallows Portal and Positioner.** Base UI's docs have every caller nest
Root → Trigger → Portal → Positioner → Popup by hand; that is their surface, not this
library's. `side` / `align` / `sideOffset` are behaviour, not `tv()` variants — Tooltip's call.
**No ARIA to patch, unlike Tooltip:** `role="menu"`, `role="menuitem"` and the group↔label
`aria-labelledby` all come from Base UI. Verified in `node_modules` *and* measured in the browser.
**Disabled hangs off `data-disabled`, not `:disabled`** — Base UI builds items with
`focusableWhenDisabled`, so Tabs' situation, not SegmentedControl's. And **hover and keyboard
are one state**: `highlightItemOnHover` defaults true, so Figma's separate Hover and Focus
collapse to `data-highlighted:` for the background plus `focus-visible:` for the ring.
**The popup itself needs `outline-none`.** Base UI parks focus on the popup when a menu is opened
by click, and the browser then draws *its own* focus ring on it — the macOS accent colour, which
has nothing to do with this theme. The popup is a way-station, not a stop.
**The separator is a sibling of the group, not a child.** Figma draws a Divider inside every
group including the first, where it is invisible only because it lands on the popup's border
and gets clipped. Rendering it as a sibling means `first:hidden` does the job honestly, and puts
it where it belongs semantically. It is Base UI's `Separator` reached through the menu's own
export, not the `Divider` component.
**The items wrapper is `role="none"`** so it stays out of the ownership chain between
`role="group"` and its menuitems — the `aria-required-children` family of bug that stopped Tabs
using a real Divider inside its `tablist`. Figma puts the padding there rather than on the group
because the header sits outside it: `px-5` on the header and `p-2` + `px-3` on the items both
land text **21px** from the popup edge (Figma's 20, plus the 1px border it does not draw).
**`overflow-clip` not ported for the fourth time, but for a new reason** — here it would be
safe (an item sits 8px in, its ring reaches 3px, measured). It is `overflow-y-auto` instead,
which clips to the radius just the same and lets a long menu scroll via
`max-h-(--available-height)` rather than run off screen. Figma draws no long menu.
**Submenus anchor to the trigger row, not the parent popup** — found by measuring: Figma's
`sideOffset={-8}` produced a 17px overlap, because the row already sits 9px inside the popup's
edge and -8 double-counts that padding. `sideOffset={0}` and `alignOffset={-9}` are the honest
values; both corrections are the same 1px border Figma's frames do not carry.
**Item 32px, group header 32px, popup `rounded-lg` on Elevation/Drop Shadow/Medium** — the
numbers to check. `destructive` is ours, not Figma's: Astryx separates destructive operations
and a Delete row identical to Rename is a real gap, so build it then add it to Figma — Divider's
`emphasis` and SegmentedControl's `layout` again.
The checkbox box and radio dial **deliberately do not reuse `Checkbox` or `Radio`**: the visual
is theirs, but the state arrives from the item rather than the control, so these read it with
`group-data-checked:`. A shared recipe would need a variant for where its own state comes from,
which is worse than two short lists of classes.
Left out: `Menu.LinkItem` (Astryx says outright not to use a dropdown for navigation, and Tabs
left `href` tabs out for the same reason), `Arrow`, `Backdrop`, `Viewport`, `Menubar`,
`ContextMenu`, and the `Handle`/`createHandle` detached-trigger system.
**Story trap:** a closed menu has no popup in the DOM, so the suite's axe run would pass by
looking at nothing. The `Open` and `Groups` stories start open on purpose — Toast's lesson.
