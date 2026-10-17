import { Children, isValidElement } from 'react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

/**
 * The row the user is currently on, found in the tree the sheet was given.
 *
 * The trigger names where you are, and the sheet already knows: exactly one
 * `NavItem` in it carries `selected`. Reading it from there rather than making
 * the caller pass the same fact twice is what keeps the pill from disagreeing
 * with the list — a nav that says "Home" while Inbox is highlighted is a bug
 * nobody would write on purpose, and a duplicated prop is how it happens.
 *
 * Walks `SideNav.Section`, `SideNav.Group` and fragments alike by recursing
 * through `children`, and stops at the first match.
 */
export function findSelected(node: ReactNode): { label?: string; icon?: LucideIcon } | null {
  let found: { label?: string; icon?: LucideIcon } | null = null
  Children.forEach(node, (child) => {
    if (found || !isValidElement(child)) return
    const props = child.props as {
      selected?: boolean
      children?: ReactNode
      startIcon?: LucideIcon
    }
    if (props.selected === true) {
      found = {
        // Only a string is usable as a trigger label; anything richer is the
        // caller's own composition and cannot be flattened honestly.
        label: typeof props.children === 'string' ? props.children : undefined,
        icon: props.startIcon,
      }
      return
    }
    if (props.children != null) {
      const deeper = findSelected(props.children)
      if (deeper) found = deeper
    }
  })
  return found
}
