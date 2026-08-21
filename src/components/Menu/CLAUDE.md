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
numbers to check. `destructive` **was** ours and is now Figma's `Type=Danger`: Astryx separates
destructive operations and a Delete row identical to Rename is a real gap, so it was built here
first — Divider's `emphasis` and SegmentedControl's `layout` again — and the file caught up when
ContextMenu landed (`40004149:7376` and siblings, on `Content/Danger`). The prop stays a boolean
rather than becoming a third `type`, because that is how it reads at a call site. No code changed
when the variants arrived, which is what a clean catch-up looks like.
The checkbox box and radio dial **deliberately do not reuse `Checkbox` or `Radio`**: the visual
is theirs, but the state arrives from the item rather than the control, so these read it with
`group-data-checked:`. A shared recipe would need a variant for where its own state comes from,
which is worse than two short lists of classes.
Left out: `Menu.LinkItem` (Astryx says outright not to use a dropdown for navigation, and Tabs
left `href` tabs out for the same reason), `Arrow`, `Backdrop`, `Viewport`, `Menubar`, and the
`Handle`/`createHandle` detached-trigger system.
**`ContextMenu` was on that list and is now [its own component](../ContextMenu/CLAUDE.md)**, which
shares these rows wholesale — Base UI's context-menu subpath re-exports `Item`, `Group`,
`SubmenuRoot` and the rest as the same component objects, so a change to a row here changes both
menus. The popup recipe they both use moved to `./styles.ts` for that reason. **Figma agrees**: it
briefly had its own `Context Menu Item` and `Context Menu Group` sets, and retired them the day
ContextMenu landed so that `Context Menu` instances `Menu Group` and `Menu Item` directly. The one
thing it found that reflects back here is the ARIA: a menu popup takes its accessible name from
whichever trigger opened it, and a context menu has no such trigger — so **Menu's "no ARIA to
patch" is true of Menu only**, and ContextMenu supplies its own `aria-label`.
**Story trap:** a closed menu has no popup in the DOM, so the suite's axe run would pass by
looking at nothing. The `Open` and `Groups` stories start open on purpose — Toast's lesson.
