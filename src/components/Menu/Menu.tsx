import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { Check, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { tv, type VariantProps } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRingUnhovered } from '../../lib/focus'
import { overlayLayer } from '../../lib/layers'
import { Icon } from '../Icon'
import { popup } from './styles'

/**
 * Menu — a list of actions in a popup, opened by a button.
 *
 * Mirrors the Figma component sets "Menu" (node 40004146:5575), "Menu Group"
 * (40004146:5285), "Menu Item" (40004145:4024, `Type` Action | Nested x `State`
 * Default | Hover | Focus | Disabled), "Menu Item Checkbox" (40004146:4924) and
 * "Menu Item Radio" (40004146:5107), plus the composed examples at
 * 40004145:3915.
 *
 *     <Menu>
 *       <Menu.Trigger render={<Button endIcon={ChevronDown}>Song</Button>} />
 *       <Menu.Popup>
 *         <Menu.Group>
 *           <Menu.Item onClick={addToLibrary}>Add to Library</Menu.Item>
 *           <Menu.Submenu label="Add to Playlist">
 *             <Menu.Item>Get Up!</Menu.Item>
 *           </Menu.Submenu>
 *         </Menu.Group>
 *         <Menu.Group label="Sort">
 *           <Menu.RadioGroup value={sort} onValueChange={setSort}>
 *             <Menu.RadioItem value="date">Date</Menu.RadioItem>
 *           </Menu.RadioGroup>
 *         </Menu.Group>
 *       </Menu.Popup>
 *     </Menu>
 *
 * **Ninth Base UI component, and the second that portals** — it copies the
 * pattern Tooltip set. Base UI supplies the whole lifecycle: `role="menu"`,
 * `role="menuitem"`, roving tabindex, arrow keys, typeahead, Escape, submenu
 * hover intent, collision flipping, and holding the popup in the DOM until the
 * closing transition ends.
 *
 * **`Menu.Popup` swallows Portal and Positioner.** Base UI's docs have every
 * caller nest Root > Trigger > Portal > Positioner > Popup by hand; that is
 * their surface, not this library's. `side`, `align` and `sideOffset` land on
 * the positioner, which is also what flips the popup when it would leave the
 * viewport — so, as in Tooltip, they are behaviour rather than `tv()` variants.
 * The raw parts are attached below for anything this shape cannot express.
 *
 * **No ARIA to patch, unlike Tooltip.** `role="menu"` and `role="menuitem"` are
 * both supplied — verified in `node_modules`, not assumed — as is the
 * `aria-labelledby` wiring between a group and its label.
 *
 * **Disabled hangs off `data-disabled`, not `:disabled`.** Base UI builds menu
 * items with `focusableWhenDisabled`, so a disabled item keeps its place in the
 * roving tabindex and is announced rather than silently missing. It never
 * carries the native attribute, so Checkbox's `disabled:` classes would fire on
 * nothing here. Tabs is in exactly the same position; SegmentedControl is not.
 *
 * **Hover and keyboard are one state.** Base UI's `highlightItemOnHover`
 * defaults to true, so `data-highlighted` covers both, which is why Figma's
 * separate Hover and Focus states collapse to one background rule plus a
 * `:focus-visible` ring.
 *
 * **What is left out.** `Menu.LinkItem`: Astryx says outright not to use a
 * dropdown for navigation, and Tabs already left `href` tabs out for the same
 * reason — a link is a different a11y contract. Also `Arrow` (Figma draws
 * none), `Backdrop`, `Viewport`, `Menubar`, and the `Handle`/`createHandle`
 * detached-trigger system.
 *
 * `ContextMenu` used to be on that list and is now its own component. It shares
 * this file's rows wholesale — Base UI's context-menu subpath re-exports Menu's
 * `Item`, `Group`, `SubmenuRoot` and the rest as the same component objects — so
 * a change made to a row here changes both menus. The popup recipe they both use
 * lives in `./styles.ts` for that reason.
 */

/**
 * A row. One recipe for every kind of item — action, submenu trigger, checkbox
 * and radio — because Figma draws them as one 32px row with one hover and one
 * focus treatment, and only the leading slot differs.
 *
 * Focus is the library's shared ring, in its `focusRingUnhovered` form
 * (src/lib/focus.ts) — the ring, suppressed on the row the pointer is resting
 * on. Base UI focuses the row you hover, and Chrome will call a scripted
 * `.focus()` `:focus-visible` whenever the last interaction was a keypress, so
 * the plain ring follows the mouse: measured in `Menu` after opening it with
 * Tab then ArrowDown, and in `ContextMenu` on *every* hover, because a
 * right-click leaves focus on `<body>` and nothing ever sets the pointer
 * modality at all. The hovered row is not left unmarked — `data-highlighted`
 * paints it — and arrowing away from a parked mouse still rings the row you
 * moved to.
 *
 * `group` is here so the checkbox box and radio dial can read `data-checked`
 * off the item, which is where Base UI puts it.
 */
const item = tv({
  base: [
    'group flex w-full items-center gap-3',
    // px-3 = spacing/3 (12px), py-1 = spacing/1 (4px), so 24 + 8 = 32px tall.
    'rounded-md px-3 py-1',
    'cursor-pointer text-base select-none',
    'text-content-primary',
    // Hover and keyboard highlight are the same attribute — see the header.
    'data-highlighted:bg-surface-card-subtle',
    ...focusRingUnhovered,
    'data-disabled:pointer-events-none data-disabled:opacity-40',
    'transition-colors duration-fast-min ease-standard',
  ],

  variants: {
    /**
     * Figma's `Type=Danger`, but built here first: the axis was Action | Nested
     * only, while Astryx's own Actions example separates destructive operations
     * and a Delete row that looks identical to Rename is a real gap. The same
     * call as Divider's `emphasis` and SegmentedControl's `layout` — build it,
     * then add it to Figma — and the file caught up when ContextMenu landed. It
     * stays a boolean rather than a third `type`, because that is how it reads
     * at a call site. The leading icon inherits the colour, as Icon is built to.
     */
    destructive: {
      true: 'text-content-danger',
      false: '',
    },
  },

  defaultVariants: { destructive: false },
})

/**
 * The 20px box and dial inside a checkbox or radio item.
 *
 * Deliberately *not* reusing `Checkbox` or `Radio`. The visual is theirs — same
 * tokens, same 20px, same 8px glyph — but the state arrives from a different
 * place: here the item owns `data-checked`, so these read it off the ancestor
 * with `group-data-checked:`, where the standalone controls read it off
 * themselves. A shared recipe would need a variant for where its own state
 * comes from, which is a worse abstraction than two short lists of classes.
 */
const indicatorBox = tv({
  base: [
    'flex size-5 shrink-0 items-center justify-center border',
    'bg-input-background border-input-border',
    'group-data-checked:bg-input-selected group-data-checked:border-input-selected',
    'text-input-selected-foreground',
    'transition-colors duration-fast-min ease-standard',
  ],
  variants: {
    shape: {
      // Figma's Checkbox: border-radius/rounded-sm (6px).
      box: 'rounded-sm',
      // Figma's Radio: border-radius/rounded-full.
      dial: 'rounded-full',
    },
  },
  defaultVariants: { shape: 'box' },
})

type ItemVariants = VariantProps<typeof item>

/** The label column, shared by every kind of row. */
function ItemLabel({ children, description }: { children: ReactNode; description?: ReactNode }) {
  return (
    <span className="flex min-w-px flex-1 flex-col items-start">
      <span className="text-base">{children}</span>
      {description != null && <span className="text-sm text-content-subtle">{description}</span>}
    </span>
  )
}

export interface MenuPopupProps
  extends Omit<ComponentPropsWithRef<typeof MenuPrimitive.Popup>, 'className' | 'render'> {
  /** Preferred side. Flips automatically to avoid leaving the viewport. */
  side?: 'top' | 'right' | 'bottom' | 'left' | 'inline-start' | 'inline-end'
  /** Alignment along that side. */
  align?: 'start' | 'center' | 'end'
  /** Gap between trigger and popup, in pixels. */
  sideOffset?: number
  /** Shift along the alignment axis, in pixels. */
  alignOffset?: number
  className?: string
}

function MenuPopup({
  children,
  side = 'bottom',
  align = 'start',
  sideOffset = 4,
  alignOffset = 0,
  className,
  ...props
}: MenuPopupProps) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className={overlayLayer}
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <MenuPrimitive.Popup className={cn(popup(), className)} {...props}>
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

MenuPopup.displayName = 'Menu.Popup'

export interface MenuGroupProps {
  /** Optional heading. Figma's `Group Header`, and the group's accessible name. */
  label?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * A group of items, with the rule above it.
 *
 * **The separator is a sibling of the group, not a child.** Figma draws a
 * Divider inside every Menu Group, including the first, where it is invisible
 * only because it lands on the popup's own border and gets clipped. Relying on
 * that would be a trick; rendering it as a sibling means `first:hidden` does the
 * job honestly — the first group's separator really is the popup's first child.
 * It also puts the separator where it belongs semantically, between two groups
 * rather than inside one.
 *
 * It is **Base UI's `Separator`, not the `Divider` component** — the same
 * underlying primitive, but reached through the menu's own export so it sits in
 * the menu tree as a direct child of the popup.
 *
 * The items sit in their own padded wrapper, marked `role="none"` so it stays
 * out of the ownership chain between `role="group"` and its `role="menuitem"`
 * children. Figma's group puts padding there rather than on the group itself,
 * because the header has to sit outside it: `px-5` on the header and `p-2 px-3`
 * on the items both land text 20px from the popup edge.
 */
function MenuGroup({ label, children, className }: MenuGroupProps) {
  return (
    <>
      <MenuPrimitive.Separator className="h-px shrink-0 bg-surface-border first:hidden" />
      <MenuPrimitive.Group className={cn('flex flex-col', className)}>
        {label != null && (
          <MenuPrimitive.GroupLabel className="px-5 pt-3 text-sm text-content-subtle">
            {label}
          </MenuPrimitive.GroupLabel>
        )}
        <div role="none" className="flex flex-col p-2">
          {children}
        </div>
      </MenuPrimitive.Group>
    </>
  )
}

MenuGroup.displayName = 'Menu.Group'

export interface MenuItemProps
  extends Omit<ComponentPropsWithRef<typeof MenuPrimitive.Item>, 'className' | 'render'> {
  /** Lucide icon before the label. Pass the component: `startIcon={Trash}`. */
  startIcon?: LucideIcon
  /** Secondary line under the label. Figma's `Sub label`. */
  description?: ReactNode
  /** Colours the row for a destructive action. */
  destructive?: ItemVariants['destructive']
  className?: string
}

function MenuItem({
  children,
  startIcon,
  description,
  destructive,
  className,
  ...props
}: MenuItemProps) {
  return (
    <MenuPrimitive.Item className={cn(item({ destructive }), className)} {...props}>
      {startIcon && <Icon icon={startIcon} />}
      <ItemLabel description={description}>{children}</ItemLabel>
    </MenuPrimitive.Item>
  )
}

MenuItem.displayName = 'Menu.Item'

export interface MenuSubmenuProps {
  /** The trigger row's label. */
  label: ReactNode
  /** Lucide icon before the label. */
  startIcon?: LucideIcon
  /** Whether the trigger row is disabled. */
  disabled?: boolean
  /** The submenu's own groups and items. */
  children: ReactNode
  className?: string
}

/**
 * Figma's `Type=Nested` item and the flyout it opens.
 *
 * The offsets come off Figma's composed example: it places the flyout at x=156
 * against a 164px parent, and 8px above its trigger row.
 *
 * **The submenu is anchored to the trigger row, not to the parent popup** —
 * measured, after `sideOffset={-8}` produced a 17px overlap instead of 8. The
 * row already sits 9px inside the popup's right edge (1px border plus the
 * group's 8px padding), so a further -8 double-counts that padding. `0` is the
 * honest value: the flyout's edge meets the column of items it came from, which
 * is what Figma is drawing. It lands 9px over the parent's border box rather
 * than Figma's 8 because Figma's frames carry no border, and it stays correct
 * if that padding ever changes.
 *
 * `alignOffset={-9}` is the vertical half, and the same correction: Figma lifts
 * the flyout 8px so its first item lands level with the trigger row, but its
 * frames carry no border, so in code the offset has to clear the popup's 1px
 * one as well. Measured: at -8 the first item sat 2px low, at -9 it sits 0.8px
 * low, and the remainder is the positioner landing on a subpixel rather than
 * anything to fix.
 *
 * `side="inline-end"` rather than `"right"` so it flips for a right-to-left
 * document as well as for the viewport edge.
 */
function MenuSubmenu({ label, startIcon, disabled, children, className }: MenuSubmenuProps) {
  return (
    <MenuPrimitive.SubmenuRoot>
      <MenuPrimitive.SubmenuTrigger className={cn(item(), className)} disabled={disabled}>
        {startIcon && <Icon icon={startIcon} />}
        <ItemLabel>{label}</ItemLabel>
        <Icon icon={ChevronRight} />
      </MenuPrimitive.SubmenuTrigger>
      <MenuPopup side="inline-end" align="start" sideOffset={0} alignOffset={-9}>
        {children}
      </MenuPopup>
    </MenuPrimitive.SubmenuRoot>
  )
}

MenuSubmenu.displayName = 'Menu.Submenu'

export interface MenuCheckboxItemProps
  extends Omit<ComponentPropsWithRef<typeof MenuPrimitive.CheckboxItem>, 'className' | 'render'> {
  /** Secondary line under the label. */
  description?: ReactNode
  className?: string
}

function MenuCheckboxItem({ children, description, className, ...props }: MenuCheckboxItemProps) {
  return (
    <MenuPrimitive.CheckboxItem className={cn(item(), className)} {...props}>
      <span className={indicatorBox({ shape: 'box' })}>
        <MenuPrimitive.CheckboxItemIndicator className="flex">
          {/* 14px, as in Checkbox: Figma binds the glyph to width/w-3,5. */}
          <Icon icon={Check} className="size-3.5" />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      <ItemLabel description={description}>{children}</ItemLabel>
    </MenuPrimitive.CheckboxItem>
  )
}

MenuCheckboxItem.displayName = 'Menu.CheckboxItem'

export interface MenuRadioItemProps
  extends Omit<ComponentPropsWithRef<typeof MenuPrimitive.RadioItem>, 'className' | 'render'> {
  /** Secondary line under the label. */
  description?: ReactNode
  className?: string
}

function MenuRadioItem({ children, description, className, ...props }: MenuRadioItemProps) {
  return (
    <MenuPrimitive.RadioItem className={cn(item(), className)} {...props}>
      <span className={indicatorBox({ shape: 'dial' })}>
        {/* r="4" in Figma's exported SVG, so 8px across — the same dot Radio draws. */}
        <MenuPrimitive.RadioItemIndicator className="size-2 rounded-full bg-input-selected-foreground" />
      </span>
      <ItemLabel description={description}>{children}</ItemLabel>
    </MenuPrimitive.RadioItem>
  )
}

MenuRadioItem.displayName = 'Menu.RadioItem'

export interface MenuProps extends ComponentPropsWithRef<typeof MenuPrimitive.Root> {}

export function Menu(props: MenuProps) {
  return <MenuPrimitive.Root {...props} />
}

Menu.displayName = 'Menu'

Menu.Trigger = MenuPrimitive.Trigger
Menu.Popup = MenuPopup
Menu.Group = MenuGroup
Menu.Item = MenuItem
Menu.Submenu = MenuSubmenu
Menu.CheckboxItem = MenuCheckboxItem
Menu.RadioGroup = MenuPrimitive.RadioGroup
Menu.RadioItem = MenuRadioItem
Menu.Separator = MenuPrimitive.Separator

/**
 * The raw Base UI parts, for the shapes the wrappers above cannot express: a
 * popup positioned against something other than its trigger, or a menu held
 * open for a screenshot.
 */
Menu.Root = MenuPrimitive.Root
Menu.Portal = MenuPrimitive.Portal
Menu.Positioner = MenuPrimitive.Positioner
Menu.RawPopup = MenuPrimitive.Popup
