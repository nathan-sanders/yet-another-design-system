import { useContext } from 'react'
import type { ComponentPropsWithRef } from 'react'
import { GripVertical } from 'lucide-react'

import { cn } from '../../lib/cn'
import { Button, type ButtonProps } from '../Button'
import { SortableItemContext } from './context'
import { dragHandle } from './styles'

/**
 * DragHandle — the grip, and the one place a keyboard can pick an item up.
 *
 * A pointer can start a drag from anywhere on a `Sortable.Item`; a keyboard
 * cannot, because Space on a card that is itself a button has to keep meaning
 * "press the card". So the grip is a real `Button` — icon-only ghost, the
 * library's default size, the shared focus ring — and the KeyboardSensor is
 * bound to it alone: Space or Enter lifts, the arrow keys move, Space or
 * Enter drops, Escape puts it back. The instructions saying so are attached
 * with `aria-describedby`, and the item's name is the button's.
 *
 * Reads its wiring from the surrounding `Sortable.Item`. A caller using
 * `useSortableItem` directly passes `handleProps` through instead — explicit
 * props win.
 */
export interface DragHandleProps
  extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'color' | 'aria-label'> {
  /** The item's name. Defaults to the `Sortable.Item`'s `label`; the handle is "Move {label}". */
  label?: string
  size?: ButtonProps['size']
}

export function DragHandle({ label, size, className, ...props }: DragHandleProps) {
  const item = useContext(SortableItemContext)
  const name = label ?? item?.label
  if (name === undefined) {
    throw new Error('DragHandle needs a `label`, or a `Sortable.Item` around it to take one from.')
  }

  return (
    <Button
      appearance="ghost"
      size={size}
      startIcon={GripVertical}
      aria-label={`Move ${name}`}
      {...item?.handleProps}
      className={cn(dragHandle({ dragging: item?.isDragging ?? false }), className)}
      {...props}
    />
  )
}

DragHandle.displayName = 'DragHandle'
