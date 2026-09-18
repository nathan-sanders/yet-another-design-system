import type { UniqueIdentifier } from '@dnd-kit/core'

/**
 * The arithmetic of a sortable that spans more than one container — a kanban
 * board's columns, a dashboard's rows.
 *
 * dnd-kit only knows droppables. Which container an item is *in* is the
 * caller's state, and the two handlers that change it — `onDragOver` while a
 * drag crosses a boundary, `onDragEnd` when it settles — both reduce to one
 * question: given the id under the pointer, where does the active item go?
 * `moveItem` answers it; the smaller functions are its parts, exported so a
 * caller with a rule of its own (the dashboard's "an emptied row disappears")
 * can compose them.
 *
 * Every function returns the **same reference** when nothing changes, so a
 * `setState` in an `onDragOver` that fires on every pixel does not re-render
 * the board on every pixel.
 */

/**
 * Item ids by container id, in order. The whole state of a multi-container
 * sortable. Generic over the id so a caller keyed on strings keeps strings;
 * the functions take dnd-kit's wider `UniqueIdentifier` for what they are
 * *given*, because that is what `active.id` and `over.id` are.
 */
export type Containers<Id extends UniqueIdentifier = UniqueIdentifier> = Record<string, Id[]>

/**
 * The container holding `id` — or `id` itself when it names a container,
 * which is what `over.id` is when the pointer is on an empty column rather
 * than on a card in it. `null` for an id nobody owns.
 */
export function findContainer(containers: Containers, id: UniqueIdentifier): string | null {
  if (id in containers) return String(id)
  for (const [container, items] of Object.entries(containers)) {
    if ((items as UniqueIdentifier[]).includes(id)) return container
  }
  return null
}

/** `arrayMove`, kept local so a node test does not need dnd-kit's browser build. */
export function reorder<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= list.length) return list as T[]
  const next = list.slice()
  const [item] = next.splice(from, 1)
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item)
  return next
}

/**
 * Takes `id` out of `from` and puts it into `to` at `index`. Omit `index`, or
 * pass one past the end, to append. Same reference when `id` is not in `from`.
 */
export function moveBetweenContainers<Id extends UniqueIdentifier>(
  containers: Containers<Id>,
  id: UniqueIdentifier,
  from: string,
  to: string,
  index?: number,
): Containers<Id> {
  const source = containers[from]
  const target = containers[to]
  if (!source || !target || !(source as UniqueIdentifier[]).includes(id)) return containers
  const item = id as Id
  if (from === to) {
    const fromIndex = source.indexOf(item)
    const toIndex = index === undefined ? source.length - 1 : index
    const moved = reorder(source, fromIndex, toIndex)
    return moved === source ? containers : { ...containers, [from]: moved }
  }
  const nextTarget = target.slice()
  nextTarget.splice(index === undefined ? nextTarget.length : Math.max(0, Math.min(index, nextTarget.length)), 0, item)
  return {
    ...containers,
    [from]: source.filter((other) => other !== item),
    [to]: nextTarget,
  }
}

/**
 * What the two drag handlers call. `overId` is whatever dnd-kit reports under
 * the active item: another item, in which case the active one takes its
 * place, or a container, in which case it goes to the end of it.
 */
export function moveItem<Id extends UniqueIdentifier>(
  containers: Containers<Id>,
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
): Containers<Id> {
  if (activeId === overId) return containers
  const from = findContainer(containers, activeId)
  const to = findContainer(containers, overId)
  if (!from || !to) return containers
  const index = overId in containers ? undefined : (containers[to] as UniqueIdentifier[]).indexOf(overId)
  return moveBetweenContainers(containers, activeId, from, to, index)
}
