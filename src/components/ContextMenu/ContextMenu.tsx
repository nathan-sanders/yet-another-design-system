import type { ComponentPropsWithRef, ReactNode } from 'react'
import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu'

import { cn } from '../../lib/cn'
import { overlayLayer } from '../../lib/layers'
import { Menu } from '../Menu'
import { popup } from '../Menu/styles'

/**
 * ContextMenu — the same menu, opened by right-click or long press at the
 * pointer. Mirrors the Figma component sets "Context Menu" (node
 * 40004155:13536), "Context Menu Group" (40004155:13278) and "Context Menu Item"
 * (40004155:13195, `Type` Action | Danger | Nested x `State` Default | Hover |
 * Focus | Disabled).
 *
 *     <ContextMenu>
 *       <ContextMenu.Trigger render={<Card />} />
 *       <ContextMenu.Popup>
 *         <ContextMenu.Group>
 *           <ContextMenu.Item startIcon={Pencil}>Rename</ContextMenu.Item>
 *         </ContextMenu.Group>
 *         <ContextMenu.Group>
 *           <ContextMenu.Item startIcon={Trash} destructive>Delete</ContextMenu.Item>
 *         </ContextMenu.Group>
 *       </ContextMenu.Popup>
 *     </ContextMenu>
 *
 * **This component is `Menu`, and that is not a figure of speech.** Base UI's
 * `@base-ui/react/context-menu` re-exports Menu's parts — `Item`, `Group`,
 * `Popup`, `SubmenuRoot`, `CheckboxItem`, `Separator` — as literally the same
 * component objects, and `ContextMenu.Root` renders a `Menu.Root` underneath
 * with a virtual anchor at the cursor. Figma draws the two identically: the same
 * 32px row with a hidden leading icon and a hidden sub-label, the same group with
 * its divider and 20px header, the same card on Elevation/Drop Shadow/Medium.
 * So the rows below are `Menu`'s rows, re-attached under this namespace rather
 * than copied. Only three things are new: the Root, the Trigger, and a Popup
 * that hands the positioner different arguments.
 *
 * **Danger is Figma's word, `destructive` is the code's.** `Context Menu Item`
 * has a third `Type` that `Menu Item` does not — Menu's `destructive` prop was
 * built ahead of the file on Astryx's guidance, and the file has since drawn it,
 * but only on this set. One name for one thing across both menus is worth more
 * than matching the axis, so the prop stays `destructive` and Figma owes
 * `Menu Item` a `Danger` type.
 *
 * **There is no keyboard way in, and there should not be.** Base UI renders the
 * trigger as a plain `<div>` with no `tabIndex`, which is right — giving it one
 * would make an interactive element with no role. Both Base UI and Astryx say
 * the same thing instead: a context menu must never be the only route to an
 * action. Pair it with a `Menu`, and prefer a trigger that renders something
 * already focusable, so the Menu key and Shift+F10 reach it for free.
 *
 * **What is left out.** `Backdrop` — Base UI already renders an internal one to
 * catch the outside press, and Figma draws none. `Arrow`, because there is no
 * anchor edge to point at. `LinkItem`, for Menu's reason, unchanged.
 */

export interface ContextMenuPopupProps
  extends Omit<
    ComponentPropsWithRef<typeof ContextMenuPrimitive.Popup>,
    'className' | 'render' | 'aria-label'
  > {
  /**
   * Preferred side. Left undefined so the menu opens at the pointer; set it and
   * the menu anchors to the click point like an ordinary popup instead.
   */
  side?: 'top' | 'right' | 'bottom' | 'left' | 'inline-start' | 'inline-end'
  /** Alignment along that side. */
  align?: 'start' | 'center' | 'end'
  /** Gap between the pointer and the popup, in pixels. */
  sideOffset?: number
  /** Shift along the alignment axis, in pixels. */
  alignOffset?: number
  /** The menu's accessible name, announced when it opens. */
  label?: string
  className?: string
}

/**
 * The popup. Portal and Positioner are swallowed, exactly as `Menu.Popup`
 * swallows them.
 *
 * **It cannot just be `Menu.Popup`, for one reason.** Base UI's positioner
 * branches on `parent.type === 'context-menu'` and hugs the pointer — but only
 * when `side` has been left undefined. `Menu.Popup` defaults `side` to `bottom`
 * and `sideOffset` to 4, which skips that branch and parks the menu below the
 * click rather than at it. So every positioning prop here defaults to
 * `undefined` and Base UI owns the numbers. That is the whole difference between
 * the two wrappers; the card itself is the shared recipe from `Menu/styles.ts`.
 *
 * **The one piece of ARIA to patch, which is Tooltip's situation again.** Base
 * UI names a menu popup with `aria-labelledby` pointing at whichever trigger
 * opened it. A context menu trigger never registers as one — it only sets the
 * anchor — so there is no id to point at and the `role="menu"` arrives with no
 * accessible name at all. Astryx patches the same hole with a `label` prop, and
 * this takes its default wording too.
 *
 * `label` is spread only when it is a string, never as `undefined`: forwarding
 * an `aria-*` prop as `undefined` deletes what Base UI computed, so a caller who
 * passes their own `aria-labelledby` and `label={undefined}` would otherwise end
 * up with neither.
 */
function ContextMenuPopup({
  children,
  side,
  align,
  sideOffset,
  alignOffset,
  label = 'Context menu',
  className,
  ...props
}: ContextMenuPopupProps) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Positioner
        className={overlayLayer}
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <ContextMenuPrimitive.Popup
          className={cn(popup(), className)}
          {...(label != null && { 'aria-label': label })}
          {...props}
        >
          {children}
        </ContextMenuPrimitive.Popup>
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  )
}

ContextMenuPopup.displayName = 'ContextMenu.Popup'

export interface ContextMenuTriggerProps
  extends Omit<ComponentPropsWithRef<typeof ContextMenuPrimitive.Trigger>, 'className'> {
  className?: string
}

export interface ContextMenuProps extends ComponentPropsWithRef<typeof ContextMenuPrimitive.Root> {
  children?: ReactNode
}

export function ContextMenu(props: ContextMenuProps) {
  return <ContextMenuPrimitive.Root {...props} />
}

ContextMenu.displayName = 'ContextMenu'

/**
 * The area you right-click. Renders a `<div>`, or whatever you pass to `render`.
 * Nothing is styled here: the trigger is the caller's own content.
 */
ContextMenu.Trigger = ContextMenuPrimitive.Trigger
ContextMenu.Popup = ContextMenuPopup

/**
 * The rows, shared with `Menu` rather than reimplemented — see the header. A
 * submenu needs no adjustment either: Base UI types a `SubmenuRoot`'s parent as
 * `menu` even inside a context menu, so `Menu.Submenu`'s measured offsets are
 * still the right ones.
 */
ContextMenu.Group = Menu.Group
ContextMenu.Item = Menu.Item
ContextMenu.Submenu = Menu.Submenu
ContextMenu.CheckboxItem = Menu.CheckboxItem
ContextMenu.RadioGroup = Menu.RadioGroup
ContextMenu.RadioItem = Menu.RadioItem
ContextMenu.Separator = Menu.Separator

/**
 * The raw Base UI parts, for the shapes the wrappers above cannot express: a
 * menu anchored to something other than the pointer, or one held open for a
 * screenshot.
 */
ContextMenu.Root = ContextMenuPrimitive.Root
ContextMenu.Portal = ContextMenuPrimitive.Portal
ContextMenu.Positioner = ContextMenuPrimitive.Positioner
ContextMenu.RawPopup = ContextMenuPrimitive.Popup
