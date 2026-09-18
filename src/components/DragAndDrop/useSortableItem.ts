import { useCallback, useContext, useMemo } from 'react'
import type { CSSProperties, KeyboardEventHandler, PointerEventHandler } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { UniqueIdentifier } from '@dnd-kit/core'

import { SortableContainerContext, type HandleProps } from './context'
import type { SortableItemData } from './announcements'

/**
 * The hook under `Sortable.Item`, exported for a caller whose item is not a
 * `<div>` it can wrap — a `<tr>`, say.
 *
 * ## The listener split
 *
 * dnd-kit hands back one `listeners` object meant for one element: the
 * pointer activator and the keyboard activator in the same bag. This hook
 * splits it. `onPointerDown` goes on the **item**, so a drag starts from
 * anywhere on a card the way it does on a Trello or Mixpanel board;
 * `onKeyDown` goes on the **handle**, so Space on the card's own button still
 * clicks it and only the grip lifts. The split is safe because the
 * KeyboardSensor refuses any keydown whose target is not the node given to
 * `setActivatorNodeRef` — which is the handle.
 *
 * ## The transition rewrite
 *
 * `useSortable` returns a `transition` string it has already *decided* — none
 * for the pointer-dragged source, `transform 0ms linear` for the one frame a
 * derived transform is set up, and `transform 200ms ease` when neighbours
 * shift. The decision is worth keeping; the numbers are not, because they are
 * a second source of truth the motion tokens cannot reach. So the string is
 * swapped for one that reads `--transition-duration-fast` and
 * `--ease-standard` off the stylesheet. `theme.css`'s reduced-motion rule is
 * `transition-duration: 1ms !important`, which beats an inline declaration,
 * so it clamps this like everything else with nothing further to do.
 */

/** `transform` plus the tokens. `var()` resolves in an inline `transition`. */
const TOKEN_TRANSITION = 'transform var(--transition-duration-fast) var(--ease-standard)'

function tokenTransition(transition: string | undefined): string | undefined {
  if (transition === undefined) return undefined
  // dnd-kit's own "off for one frame" — keep it exactly.
  if (transition.startsWith('transform 0ms')) return transition
  return TOKEN_TRANSITION
}

export interface UseSortableItemOptions {
  id: UniqueIdentifier
  /** The item's name. What the handle is called and what announcements say. */
  label: string
  disabled?: boolean
}

export interface SortableItem {
  /** Spread on the element that *is* the item: its ref, transform and the pointer activator. */
  itemProps: {
    ref: (node: HTMLElement | null) => void
    style: CSSProperties
    onPointerDown?: PointerEventHandler
  }
  /** Spread on the grip — `DragHandle` does this for you. */
  handleProps: HandleProps
  isDragging: boolean
  /** Another item is being carried over this one. */
  isOver: boolean
}

export function useSortableItem({ id, label, disabled }: UseSortableItemOptions): SortableItem {
  const container = useContext(SortableContainerContext)

  const data = useMemo<SortableItemData>(
    () => ({
      type: 'item',
      label,
      containerId: container?.id,
      containerLabel: container?.label,
    }),
    [label, container?.id, container?.label],
  )

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id,
    /*
      A container that has hit its `capacity` stops being a drop target for
      anything from outside it — and so do its items, or a foreign block could
      still land *between* two of them. Its own items keep sorting among
      themselves, and stay draggable out.
    */
    disabled: { draggable: disabled, droppable: disabled || container?.accepting === false },
    data,
  })

  const pointerActivator = listeners?.onPointerDown as PointerEventHandler | undefined
  const keyboardActivator = listeners?.onKeyDown as KeyboardEventHandler | undefined

  /*
    A control inside the item that must not start a drag — a remove button —
    marks itself `data-drag-ignore`, and the press never reaches the sensor.
    Cheaper than every such control calling `stopPropagation`, and it does not
    swallow the click for anything else listening.
  */
  const onPointerDown = useCallback<PointerEventHandler>(
    (event) => {
      if (event.target instanceof Element && event.target.closest('[data-drag-ignore]')) return
      pointerActivator?.(event)
    },
    [pointerActivator],
  )

  return {
    itemProps: {
      ref: setNodeRef,
      style: {
        transform: CSS.Transform.toString(transform),
        transition: tokenTransition(transition),
      },
      onPointerDown: pointerActivator ? onPointerDown : undefined,
    },
    handleProps: {
      ref: setActivatorNodeRef,
      onKeyDown: keyboardActivator,
      // `role` and `tabIndex` are dropped: the handle is a real <button>.
      'aria-describedby': attributes['aria-describedby'],
      'aria-roledescription': attributes['aria-roledescription'],
      'aria-pressed': attributes['aria-pressed'],
      'aria-disabled': attributes['aria-disabled'] || undefined,
    },
    isDragging,
    isOver,
  }
}
