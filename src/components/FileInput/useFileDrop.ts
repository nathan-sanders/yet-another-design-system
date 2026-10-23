import { useRef, useState, type DragEvent } from 'react'

import { screen, type FileRejection, type ScreenRules } from './files'

export interface UseFileDropOptions extends ScreenRules {
  /** Ignore drags entirely: no drag state, no drop, and the browser's default applies. */
  disabled?: boolean
  /**
   * The files a drop leaves, screened by `accept`, `maxSize`, `maxFiles` and
   * `multiple` (which defaults to `true` here — a zone the size of a grid
   * takes what it is given). Called on every drop, even when nothing
   * survived the rules, so `rejected` is never lost.
   */
  onDrop: (accepted: File[], rejected: FileRejection[]) => void
}

export interface UseFileDrop {
  /** A drag carrying files is over the zone. */
  dragging: boolean
  /** Spread on the element that should take the drop. Empty while `disabled`. */
  dropProps: {
    onDragEnter?: (event: DragEvent) => void
    onDragOver?: (event: DragEvent) => void
    onDragLeave?: (event: DragEvent) => void
    onDrop?: (event: DragEvent) => void
  }
}

/**
 * useFileDrop — make any element a drop target for files from the desktop.
 *
 * FileInput's dropzone, taken out of FileInput so a region that is not a form
 * control can take a drop too — an asset grid, a message thread:
 *
 *     const { dragging, dropProps } = useFileDrop({
 *       accept: 'image/*,video/*',
 *       onDrop: (files, rejected) => upload(files),
 *     })
 *     <section {...dropProps} data-dragging={dragging || undefined}>…</section>
 *
 * **Only drags that carry `Files` count.** An image or link dragged within the
 * page is a native drag too, with `text/uri-list` and no files; it passes
 * through untouched. dnd-kit drags are pointer events, not drag events, so the
 * two never meet.
 *
 * **`dragging` is counted, not toggled.** dragenter and dragleave fire for
 * every child the pointer crosses, so a boolean flickers; the depth of nested
 * enters is the standard answer.
 *
 * The hook draws nothing. FileInput paints `data-dragging` as
 * `border-input-selected` + `bg-action-ghost-background-hover`; a bigger zone
 * should use the same pair, and never an overlay token — those lighten in dark.
 */
export function useFileDrop({
  disabled = false,
  accept,
  maxSize,
  maxFiles,
  multiple = true,
  onDrop,
}: UseFileDropOptions): UseFileDrop {
  const [dragging, setDragging] = useState(false)
  const depth = useRef(0)

  // A zone disabled mid-drag stops painting at once; the count it kept is
  // discarded by the next drop or leave, since nothing reads it meanwhile.
  if (disabled) return { dragging: false, dropProps: {} }

  return {
    dragging,
    dropProps: {
      onDragEnter(event) {
        if (!event.dataTransfer.types.includes('Files')) return
        event.preventDefault()
        depth.current++
        setDragging(true)
      },
      onDragOver(event) {
        if (!event.dataTransfer.types.includes('Files')) return
        // Without this the browser opens the dropped file in the tab.
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
      },
      onDragLeave(event) {
        if (!event.dataTransfer.types.includes('Files')) return
        depth.current = Math.max(0, depth.current - 1)
        if (depth.current === 0) setDragging(false)
      },
      onDrop(event) {
        if (!event.dataTransfer.types.includes('Files')) return
        event.preventDefault()
        depth.current = 0
        setDragging(false)
        const { accepted, rejected } = screen(Array.from(event.dataTransfer.files), {
          accept,
          maxSize,
          maxFiles,
          multiple,
        })
        onDrop(accepted, rejected)
      },
    },
  }
}
