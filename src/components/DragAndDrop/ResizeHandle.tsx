import { useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { tv } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'

/**
 * ResizeHandle — the strip between two blocks, or under a row, that you
 * drag to change a size.
 *
 * Mirrors the prototype's two handles — `Item Resize Handle` between blocks
 * (16px wide, `ew-resize`) and `Row Resize Spacer` under a row (16px tall,
 * `ns-resize`) — as one component with an `orientation`. Both are the same
 * idea as `Table.ResizeHandle`, and this is that component made general: it
 * reports a **value in the caller's unit** rather than pixels, so the column
 * handle reports spans and the row handle reports pixels, and the arithmetic
 * that snaps a drag to a column lives in `spans.ts` where it is tested.
 *
 * **A focusable `separator`, not a button.** A button does one thing; this
 * does a continuous one. Being focusable makes `separator` a widget role,
 * which obliges `aria-valuenow` / `valuemin` / `valuemax` — axe checks for
 * exactly that, and a screen reader has nothing to say without them. The
 * keyboard path is the one the story tests: arrows step, Shift steps
 * further, Home and End go to the ends.
 *
 * **`data-drag-ignore`**, always: the handle sits inside a `Sortable.Item`,
 * and a press on it is a resize, never the start of a drag.
 *
 * The prototype's pill follows the cursor along the strip; here it sits in
 * the middle and shows on hover *and* on focus, so a keyboard user can see
 * which handle they are on. That is the one departure, and it is deliberate.
 */

const handle = tv({
  base: [
    'group/handle flex shrink-0 items-center justify-center rounded-sm',
    // Without this a drag on a touch device scrolls the page instead.
    'touch-none select-none',
    'hover:bg-surface-overlay-subtle transition-colors duration-fast-min ease-standard',
    ...focusRing,
  ],
  variants: {
    orientation: {
      // The line is vertical: it sits between two blocks and resizes width.
      vertical: 'h-full w-4 cursor-col-resize',
      // The line is horizontal: it sits under a row and resizes height.
      horizontal: 'h-4 w-full cursor-row-resize',
    },
  },
})

const pill = tv({
  base: [
    'bg-surface-border-emphasized rounded-full opacity-0',
    'transition-opacity duration-fast-min ease-standard',
    'group-hover/handle:opacity-100 group-focus-visible/handle:opacity-100',
  ],
  variants: {
    orientation: {
      vertical: 'h-10 w-1',
      horizontal: 'h-1 w-10',
    },
  },
})

export type ResizeHandleOrientation = 'vertical' | 'horizontal'

export interface ResizeHandleProps {
  /** What this resizes, as the accessible name: "Resize Revenue", "Resize Row 1 height". */
  label: string
  /** `vertical` sits between two blocks and changes a width; `horizontal` sits under a row and changes a height. */
  orientation: ResizeHandleOrientation
  /** The current size, in the caller's unit — columns, pixels, whatever `onResize` expects. */
  value: number
  min: number
  max: number
  onResize: (next: number) => void
  /**
   * How many pixels one unit of `value` is. `1` for a pixel value. For a
   * column span pass a function: it is read once, when a drag starts, so it
   * can measure the grid at that moment.
   */
  unit?: number | (() => number)
  /** How far one arrow key moves, in units. */
  step?: number
  /** How far Shift+arrow moves, in units. Defaults to `step`. */
  largeStep?: number
  /** Reads the value for a screen reader — "6 of 12 columns" rather than "6". */
  valueText?: (value: number) => string
  className?: string
}

export function ResizeHandle({
  label,
  orientation,
  value,
  min,
  max,
  onResize,
  unit = 1,
  step = 1,
  largeStep = step,
  valueText,
  className,
}: ResizeHandleProps) {
  const start = useRef<{ at: number; value: number; unit: number } | null>(null)
  const vertical = orientation === 'vertical'

  function clamp(next: number) {
    return Math.max(min, Math.min(max, Math.round(next)))
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLSpanElement>) {
    // Only the primary button, and never a right-click drag.
    if (event.button !== 0) return
    start.current = {
      at: vertical ? event.clientX : event.clientY,
      value,
      unit: typeof unit === 'function' ? unit() : unit,
    }
    /*
      Capture, so the pointer can leave the 16px strip mid-drag — which it
      will, because a fast drag outruns the block it is widening — and the
      moves keep arriving here instead of at whatever is under the cursor.
    */
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLSpanElement>) {
    if (!start.current) return
    const travelled = (vertical ? event.clientX : event.clientY) - start.current.at
    const next = clamp(start.current.value + travelled / start.current.unit)
    if (next !== value) onResize(next)
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLSpanElement>) {
    if (!start.current) return
    start.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    const by = event.shiftKey ? largeStep : step
    const grow = vertical ? 'ArrowRight' : 'ArrowDown'
    const shrink = vertical ? 'ArrowLeft' : 'ArrowUp'
    let next: number | null = null

    if (event.key === grow) next = value + by
    else if (event.key === shrink) next = value - by
    else if (event.key === 'Home') next = min
    else if (event.key === 'End') next = max
    if (next === null) return

    // The arrow keys otherwise scroll the region this handle sits in.
    event.preventDefault()
    next = clamp(next)
    if (next !== value) onResize(next)
  }

  return (
    <span
      role="separator"
      // The line's orientation, which is what ARIA asks for.
      aria-orientation={orientation}
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={valueText?.(value)}
      tabIndex={0}
      data-drag-ignore
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      className={cn(handle({ orientation }), className)}
    >
      <span aria-hidden="true" className={pill({ orientation })} />
    </span>
  )
}

ResizeHandle.displayName = 'ResizeHandle'
