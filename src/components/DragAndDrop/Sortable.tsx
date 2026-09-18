import { useMemo } from 'react'
import type { ComponentPropsWithRef, ReactNode, Ref } from 'react'
import { useDndContext, useDroppable, type UniqueIdentifier } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, type SortingStrategy } from '@dnd-kit/sortable'
import { useRender } from '@base-ui/react/use-render'

import { cn } from '../../lib/cn'
import { SortableContainerContext, SortableItemContext } from './context'
import { dropTarget, sortableItem } from './styles'
import { useSortableItem } from './useSortableItem'
import type { SortableContainerData } from './announcements'

/**
 * Sortable — one container of items that can be reordered, and moved between
 * containers that share a `DragAndDrop` root.
 *
 * A kanban column is one of these; so is a dashboard row. The element it
 * renders is both the `SortableContext` for its items and a droppable in its
 * own right, which is what lets a card be carried into an **empty** column:
 * with no items to collide with, the column's own rect is the target, and
 * `over.id` is the container's id.
 *
 * `items` is the same ordered array the caller keeps in state — this
 * component never reorders anything itself. It reports through the root's
 * `onDragOver` / `onDragEnd`, and `moveItem` in `move.ts` turns those into the
 * next state.
 *
 * Not a Base UI component — there is no headless sortable primitive — but it
 * takes Base UI's `render` contract, so a column body can be
 * `render={<ContentBlock.Content />}` and a real list `render={<ul />}`.
 */
export interface SortableProps extends Omit<ComponentPropsWithRef<'div'>, 'id'> {
  /** The container's id — what `over.id` is when a drag lands on the container itself. */
  id: string
  /**
   * The container's name, for the live region: "Alice is over In Progress".
   * Required, because an id is not a name.
   */
  label: string
  /** The ordered ids this container holds. */
  items: UniqueIdentifier[]
  /**
   * The most items this container will take. At the limit it stops being a
   * drop target for anything carried in from *another* container — the
   * pointer cannot land on it, the arrow keys skip it — while its own items
   * still sort among themselves. Leave it off for a container with no limit.
   */
  capacity?: number
  /**
   * How the neighbours shift as an item passes them. Vertical by default — a
   * list, a column. A row of blocks wants `horizontalListSortingStrategy`.
   */
  strategy?: SortingStrategy
  /** Base UI's render contract: `render={<ul />}`, `render={<ContentBlock.Content />}`. */
  render?: useRender.RenderProp
  children: ReactNode
}

export function Sortable({
  id,
  label,
  items,
  capacity,
  strategy = verticalListSortingStrategy,
  render,
  className,
  ref,
  children,
  ...props
}: SortableProps) {
  const data = useMemo<SortableContainerData>(() => ({ type: 'container', label }), [label])

  /*
    Full means "full to something from elsewhere": an item lifted from this
    container can be put back down in it, and one that `onDragOver` has just
    carried in still counts as ours. **Ours is `items.includes(active.id)`**,
    read off the prop, and not `active.data.current.containerId` — that ref
    is updated by the item's own render, which comes *after* this one, so at
    the exact moment a carried-in block makes the row full it still reads the
    old container. The row then refuses the block it just took, the collision
    falls back to where it came from, `onDragOver` moves it back, and the two
    rows hand it to each other until React gives up. The prop has no lag.
  */
  const { active } = useDndContext()
  const accepting =
    capacity === undefined || items.length < capacity || active === null || items.includes(active.id)

  const { setNodeRef, isOver } = useDroppable({ id, data, disabled: !accepting })
  const context = useMemo(() => ({ id, label, accepting }), [id, label, accepting])

  const element = useRender({
    render,
    ref: [ref as Ref<HTMLElement>, setNodeRef],
    defaultTagName: 'div',
    props: {
      ...props,
      className: cn(dropTarget({ over: isOver }), className),
      'data-over': isOver || undefined,
      children,
    },
  })

  return (
    <SortableContainerContext.Provider value={context}>
      <SortableContext id={id} items={items} strategy={strategy}>
        {element}
      </SortableContext>
    </SortableContainerContext.Provider>
  )
}

Sortable.displayName = 'Sortable'

/**
 * One item. The element carries the pointer activator, so a drag starts from
 * anywhere on it; a `DragHandle` inside it is the keyboard activator, and the
 * only one. What goes inside — a `ClickableCard`, a `ContentBlock` — is the
 * caller's, and gets no props from here.
 *
 * **The handle and a clickable card are siblings inside this, never nested.**
 * A `<button>` inside a `<button>` is invalid HTML and an axe failure
 * (`nested-interactive`); the wrapper is what makes the two coexist.
 */
export interface SortableItemProps extends Omit<ComponentPropsWithRef<'div'>, 'id'> {
  id: UniqueIdentifier
  /** The item's name — the handle is "Move {label}" and announcements use it. */
  label: string
  /** Neither draggable nor a drop target. */
  disabled?: boolean
  /** Base UI's render contract: `render={<li />}` in a real list. */
  render?: useRender.RenderProp
  children: ReactNode
}

function SortableItem({
  id,
  label,
  disabled = false,
  render,
  className,
  style,
  ref,
  children,
  ...props
}: SortableItemProps) {
  const { itemProps, handleProps, isDragging, isOver } = useSortableItem({ id, label, disabled })
  const context = useMemo(
    () => ({ label, handleProps, isDragging }),
    [label, handleProps, isDragging],
  )

  const element = useRender({
    render,
    ref: [ref as Ref<HTMLElement>, itemProps.ref],
    defaultTagName: 'div',
    props: {
      ...props,
      className: cn(sortableItem({ dragging: isDragging, over: isOver && !isDragging }), className),
      style: { ...itemProps.style, ...style },
      onPointerDown: itemProps.onPointerDown,
      'data-dragging': isDragging || undefined,
      'data-over': (isOver && !isDragging) || undefined,
      children,
    },
  })

  return <SortableItemContext.Provider value={context}>{element}</SortableItemContext.Provider>
}

SortableItem.displayName = 'Sortable.Item'

Sortable.Item = SortableItem
