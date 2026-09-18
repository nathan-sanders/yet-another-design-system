import type { Active, Announcements, Over, ScreenReaderInstructions } from '@dnd-kit/core'

/**
 * What a screen reader says during a drag.
 *
 * dnd-kit's defaults read ids — "Draggable item 3 was moved over droppable
 * area 2" — which is exactly the kind of sentence an id was never meant to
 * become. These read the `label` every `Sortable.Item` and `Sortable` is
 * required to carry, so the announcement is "Alice is over In Progress,
 * position 2 of 3" and a user who cannot see the board still knows where the
 * card is.
 *
 * Pure: nothing here touches the DOM, so it can be read as text and changed
 * as copy. The instructions are the same voice as the rest of the library's
 * UI copy — short, second person, no "draggable item".
 */

export const screenReaderInstructions: ScreenReaderInstructions = {
  draggable:
    'Press Space to pick this up. Use the arrow keys to move it. Press Space again to drop it, or Escape to put it back.',
}

/** The data `useSortableItem` attaches to every item. */
export interface SortableItemData {
  type: 'item'
  label: string
  containerId?: string
  containerLabel?: string
  sortable?: { index: number; items: unknown[] }
}

/** The data `Sortable` attaches to its container droppable. */
export interface SortableContainerData {
  type: 'container'
  label: string
}

type DragData = SortableItemData | SortableContainerData

function name(entry: Active | Over): string {
  const data = entry.data.current as Partial<DragData> | undefined
  return data?.label ?? String(entry.id)
}

/**
 * Where an item is, as a phrase: the container it is over, and — when it is
 * over another item rather than an empty container — the slot it would take.
 */
function place(over: Over): string {
  const data = over.data.current as Partial<DragData> | undefined
  if (!data || data.type !== 'item') return name(over)
  const position = data.sortable ? `position ${data.sortable.index + 1} of ${data.sortable.items.length}` : null
  const container = data.containerLabel
  if (container && position) return `${container}, ${position}`
  return container ?? position ?? name(over)
}

export const announcements: Announcements = {
  onDragStart({ active }) {
    return `Picked up ${name(active)}.`
  },
  onDragOver({ active, over }) {
    if (!over) return `${name(active)} is no longer over a drop target.`
    return `${name(active)} is over ${place(over)}.`
  },
  onDragEnd({ active, over }) {
    if (!over) return `${name(active)} was dropped outside a drop target. It is back where it was.`
    return `${name(active)} dropped in ${place(over)}.`
  },
  onDragCancel({ active }) {
    return `Move cancelled. ${name(active)} is back where it was.`
  },
}
