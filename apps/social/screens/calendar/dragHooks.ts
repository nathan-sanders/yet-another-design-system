import { createContext, useContext, type PointerEventHandler } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'

import { postDate } from './model'
import { targetOpen, type CalendarDragData, type DropTarget } from './drag'

/**
 * What a calendar drag tells the cells: the id of the one a release would land
 * in, so that cell alone wears the drop ring. Worked out by the screen from
 * `placeFor`, not from dnd-kit's `isOver`, which knows nothing of a drop that
 * would be refused — a past hour, or where the post already is.
 */
export const AimContext = createContext<string | null>(null)

/** A droppable cell, closed for good once its day or hour has gone. */
export function useDropTarget(id: string, target: DropTarget, label: string) {
  const { setNodeRef } = useDroppable({
    id,
    disabled: !targetOpen(target, new Date()),
    data: { label },
  })
  return { ref: setNodeRef, aimed: useContext(AimContext) === id }
}

/** What a draggable card is handed: where the pointer listener and the ref go, and whether it is carried. */
export interface CardDrag {
  ref: (element: HTMLElement | null) => void
  onPointerDown?: PointerEventHandler
  dragging: boolean
}

/**
 * Lifts a card on a pointer drag. **Only the pointer listener is handed out**,
 * as on the report's catalog tiles (`AddWidgetPanel.tsx`): the card stays a
 * plain button that opens on click, Enter or Space, and the keyboard's way to
 * move one is the Schedule dialog, not a drag.
 */
export function useCardDrag(id: string, data: CalendarDragData, enabled = true): CardDrag {
  const { setNodeRef, listeners, isDragging } = useDraggable({ id, data, disabled: !enabled })
  return {
    ref: setNodeRef,
    // dnd-kit types its listeners as `Function`.
    onPointerDown: enabled
      ? (listeners?.onPointerDown as PointerEventHandler | undefined)
      : undefined,
    dragging: isDragging,
  }
}

/** Where the post being carried is now, for `placeFor` to tell a move from no move. */
export function fromOf(data: CalendarDragData) {
  return data.source === 'post' ? { date: postDate(data.post), time: data.post.time } : undefined
}

/**
 * The cell a carried card would land in: Surface/Border Emphasized dashed, as
 * the report board marks the row a widget would join, drawn inside the cell
 * so it never paints over the next one.
 */
export const dropRing =
  'bg-action-ghost-background-hover outline-1 -outline-offset-1 outline-dashed outline-surface-border-emphasized'
