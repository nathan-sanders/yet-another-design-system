import { createContext } from 'react'
import type { KeyboardEventHandler } from 'react'

/**
 * Two contexts, both deliberately not exported from the barrel.
 *
 * The container's tells its items where they are, so an announcement can say
 * "over In Progress" and `move.ts` can find the container from the id. The
 * item's hands `DragHandle` the props that make it the keyboard activator, so
 * a caller composes `<Sortable.Item><Card /><DragHandle /></Sortable.Item>`
 * and wires nothing by hand.
 */

export interface SortableContainerContextValue {
  id: string
  label: string
  /** False while the container is full and something from elsewhere is being carried. */
  accepting: boolean
}

export const SortableContainerContext = createContext<SortableContainerContextValue | null>(null)

/** What a `DragHandle` spreads onto itself. */
export interface HandleProps {
  ref: (node: HTMLElement | null) => void
  onKeyDown?: KeyboardEventHandler
  'aria-describedby': string
  'aria-roledescription': string
  'aria-pressed'?: boolean
  'aria-disabled'?: boolean
}

export interface SortableItemContextValue {
  label: string
  handleProps: HandleProps
  isDragging: boolean
}

export const SortableItemContext = createContext<SortableItemContextValue | null>(null)
