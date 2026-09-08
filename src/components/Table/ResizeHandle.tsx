import { useRef, type PointerEvent as ReactPointerEvent, type KeyboardEvent } from 'react'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'

/**
 * The grip on a column's right edge.
 *
 * Figma draws it as a 1px `surface/border-emphasized` line at `right-0`
 * (`40005049:39107`), which is a 1px *target*. So the drawn line stays 1px and
 * the element around it is 12px wide, centred on the edge with
 * `translate-x-1/2` — the same split every resize grip in every app makes, and
 * the reason the handle is not simply the divider with a cursor on it.
 *
 * ## Why it is a focusable separator and not a button
 *
 * A button does one thing; this does a continuous one, and the role that says
 * so is `separator`. Being focusable makes `separator` a *widget* role, which
 * obliges all three of `aria-valuenow` / `valuemin` / `valuemax` — axe checks
 * for exactly that, and a screen reader has nothing to announce without them.
 *
 * The keyboard path is not a courtesy: a drag is the one interaction that has
 * no keyboard equivalent unless somebody writes one, and this is the story that
 * is actually tested, because a synthetic pointer drag in a browser runner is
 * flaky in a way that teaches you nothing.
 */

/** One arrow key. Big enough to feel, small enough to land on a number. */
const STEP = 8
/** Shift, for crossing a column quickly. */
const LARGE_STEP = 40

export interface ResizeHandleProps {
  /** Names the column this resizes — there is one of these per column. */
  label: string
  width: number
  min: number
  onResize: (width: number) => void
}

export function ResizeHandle({ label, width, min, onResize }: ResizeHandleProps) {
  const start = useRef<{ x: number; width: number } | null>(null)

  function handlePointerDown(event: ReactPointerEvent<HTMLSpanElement>) {
    // Only the primary button, and never a right-click drag.
    if (event.button !== 0) return
    start.current = { x: event.clientX, width }
    /*
      Capture, so the pointer can leave the 12px strip mid-drag — which it will,
      because a fast drag outruns the column it is widening — and the moves keep
      arriving here instead of at whatever is under the cursor.
    */
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLSpanElement>) {
    if (!start.current) return
    onResize(Math.max(min, Math.round(start.current.width + (event.clientX - start.current.x))))
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLSpanElement>) {
    if (!start.current) return
    start.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    const step = event.shiftKey ? LARGE_STEP : STEP
    let next: number | null = null

    if (event.key === 'ArrowLeft') next = width - step
    else if (event.key === 'ArrowRight') next = width + step
    else if (event.key === 'Home') next = min
    if (next === null) return

    // The arrow keys otherwise scroll the region this handle sits in.
    event.preventDefault()
    onResize(Math.max(min, next))
  }

  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${label} column`}
      aria-valuenow={width}
      aria-valuemin={min}
      /*
        There is no real ceiling — a column may be dragged as wide as somebody
        likes and the region scrolls — but a focusable separator owes axe a
        `valuemax`, and a screen reader owes the user a fraction it can say. Ten
        times the floor is a number big enough never to be reached in practice.
      */
      aria-valuemax={min * 10}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      className={cn(
        'absolute inset-y-0 right-0 z-10 flex w-3 translate-x-1/2 justify-center',
        // Without this a drag on a touch device scrolls the region instead.
        'cursor-col-resize touch-none select-none',
        focusRing,
      )}
    >
      <span aria-hidden="true" className="h-full w-px bg-surface-border-emphasized" />
    </span>
  )
}

ResizeHandle.displayName = 'Table.ResizeHandle'
