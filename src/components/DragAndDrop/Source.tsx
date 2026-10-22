import type { ComponentPropsWithRef, ReactNode, Ref } from 'react'
import type { UniqueIdentifier } from '@dnd-kit/core'
import { useRender } from '@base-ui/react/use-render'

import { cn } from '../../lib/cn'
import { dragSource } from './styles'
import { useDragSource } from './useDragSource'

export interface DragAndDropSourceProps extends Omit<ComponentPropsWithRef<'div'>, 'id'> {
  id: UniqueIdentifier
  /** The source's name. What the drag announcements say. */
  label: string
  /** The caller's payload, read back from `active.data.current` on drop. */
  data?: object
  disabled?: boolean
  /** Base UI's render contract: `render={<ClickableCard onClick={add} />}`. */
  render?: useRender.RenderProp
  children: ReactNode
}

/**
 * A thing dragged *onto* a board without being one of its items — a catalog
 * tile, a draft in a side panel. Pointer only, with no drag attributes; it
 * stays in place, faded, while `DragAndDrop.Overlay` carries a copy. The
 * keyboard's way in is the source's own click. See `useDragSource`.
 */
export function DragAndDropSource({
  id,
  label,
  data,
  disabled = false,
  render,
  className,
  ref,
  children,
  ...props
}: DragAndDropSourceProps) {
  const { sourceProps, isDragging } = useDragSource({ id, label, data, disabled })

  return useRender({
    render,
    ref: [ref as Ref<HTMLElement>, sourceProps.ref],
    defaultTagName: 'div',
    props: {
      ...props,
      className: cn(dragSource({ dragging: isDragging, disabled }), className),
      onPointerDown: sourceProps.onPointerDown,
      'data-dragging': isDragging || undefined,
      children,
    },
  })
}

DragAndDropSource.displayName = 'DragAndDrop.Source'
