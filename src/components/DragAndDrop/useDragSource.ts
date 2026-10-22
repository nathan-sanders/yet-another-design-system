import { useCallback, useMemo } from 'react'
import type { PointerEventHandler } from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { UniqueIdentifier } from '@dnd-kit/core'

/**
 * The hook under `DragAndDrop.Source`, exported for a caller that wants the
 * props without the element — a card that is already its own component.
 *
 * A **source** is a thing dragged *onto* something without being one of its
 * items: a palette, a catalog of widgets, a draft dragged from a panel onto a
 * calendar, a calendar card that is not in a list. Yet Social wrote one three
 * times before this existed (`apps/social/FINDINGS.md` 122, 130), and made the
 * same three decisions each time. They are made here once:
 *
 * - **Pointer only.** Only dnd-kit's `onPointerDown` is handed out. Its
 *   keyboard listener would make Enter and Space start a keyboard drag, and
 *   then the source — a button, nearly always — could not be clicked from the
 *   keyboard at all. The keyboard's way to do what the drag does is the
 *   source's own click (add it at the end; open a dialog to choose where),
 *   which the caller writes.
 * - **None of dnd-kit's drag attributes.** `role="button"`,
 *   `aria-roledescription="draggable"` and the instructions' `describedby`
 *   would announce a drag the keyboard cannot do.
 * - **No transform.** A source is carried *out of* something that clips it —
 *   a panel, a scrolling column, a calendar cell — so it stays where it is,
 *   faded, and the thing under the pointer is `DragAndDrop.Overlay`, every
 *   time.
 *
 * `label` is what the live region says ("Picked up Line chart"), the same
 * name `Sortable.Item` requires. `data` is merged under it and comes back on
 * `active.data.current` in the drag handlers; `type` and `label` are the
 * library's keys there.
 */

/** The data a source attaches, beside the caller's own. */
export interface DragSourceData {
  type: 'source'
  label: string
}

export interface UseDragSourceOptions<Data extends object = Record<string, unknown>> {
  id: UniqueIdentifier
  /** The source's name. What the drag announcements say. */
  label: string
  /** The caller's own payload, read back from `active.data.current` on drop. */
  data?: Data
  disabled?: boolean
}

export interface DragSource {
  /** Spread on the element that is the source: its ref and the pointer activator. */
  sourceProps: {
    ref: (node: HTMLElement | null) => void
    onPointerDown?: PointerEventHandler
  }
  isDragging: boolean
}

export function useDragSource<Data extends object = Record<string, unknown>>({
  id,
  label,
  data,
  disabled,
}: UseDragSourceOptions<Data>): DragSource {
  const merged = useMemo(() => ({ ...data, type: 'source' as const, label }), [data, label])
  const { setNodeRef, listeners, isDragging } = useDraggable({ id, data: merged, disabled })

  // dnd-kit types its listeners as `Function`.
  const pointerActivator = listeners?.onPointerDown as PointerEventHandler | undefined

  // `data-drag-ignore` on a control inside the source keeps a press on it from
  // lifting the source, as on `Sortable.Item`.
  const onPointerDown = useCallback<PointerEventHandler>(
    (event) => {
      if (event.target instanceof Element && event.target.closest('[data-drag-ignore]')) return
      pointerActivator?.(event)
    },
    [pointerActivator],
  )

  return {
    sourceProps: {
      ref: setNodeRef,
      onPointerDown: pointerActivator && !disabled ? onPointerDown : undefined,
    },
    isDragging,
  }
}
