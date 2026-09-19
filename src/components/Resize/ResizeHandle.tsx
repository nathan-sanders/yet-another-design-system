import { useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { tv } from 'tailwind-variants'

import { cn } from '../../lib/cn'
import { focusRing } from '../../lib/focus'

/**
 * ResizeHandle — the strip you drag to change a size: the gap between two
 * dashboard blocks, the seam beside an application's rail, the edge of a
 * table column.
 *
 * Mirrors the `Resize Handle` set on the Figma page `↪ Resize`
 * (`40005289:41760`, Orientation vertical | horizontal × State default | hover
 * | focus). It began life inside `DragAndDrop`, where the composable dashboard
 * needed both a drag and a resize, and moved out on 2026-09-18: a resize is not
 * a drag, and the handle's other callers — `Table`'s columns, `SideNav`'s
 * rail — have no drag anywhere near them. It is `Table.ResizeHandle` made
 * general: it reports a **value in the caller's unit** rather than pixels, so
 * the dashboard's column handle reports spans and the rail's reports pixels,
 * and the arithmetic that snaps a value lives with the caller, where it is
 * tested.
 *
 * **A handle is the gap it sits in, at the gap's size.** Between dashboard
 * blocks that is 12px, and `w-3` is the default; beside the rail the shell's
 * gap is 8, and the rail passes `w-2`. A handle wider than its gap is a handle
 * lying over something.
 *
 * **A focusable `separator`, not a button.** A button does one thing; this
 * does a continuous one. Being focusable makes `separator` a widget role,
 * which obliges `aria-valuenow` / `valuemin` / `valuemax` — axe checks for
 * exactly that, and a screen reader has nothing to say without them. The
 * keyboard path is the one the stories test: arrows step, Shift steps
 * further, Home and End go to the ends.
 *
 * **`data-drag-ignore`, always.** It is the contract with `DragAndDrop`: a
 * `Sortable.Item` starts a drag from a press anywhere on itself *except* on an
 * element carrying this attribute (`useSortableItem`), so a handle inside one
 * is a resize and never a lift. Outside a drag root the attribute is inert and
 * costs nothing, which is why it is unconditional rather than a prop.
 *
 * **`onResizeStart` / `onResizeEnd` bracket a pointer drag**, and only that.
 * A keystroke is one resize, complete in itself; a drag is a stream of them,
 * and a caller whose size is on a CSS transition needs to know when the stream
 * starts and stops so it can switch the transition off for its length — a
 * 400ms ease trailing the pointer reads as a broken handle.
 *
 * **The pill follows the pointer along the strip**, as the prototype's does:
 * hovering a 160px-tall handle near its top puts the pill near the top, and
 * it slides after the cursor at `duration-fast-min` — the same follow the
 * prototype draws, with an easing the prototype did not have. Where the pill
 * is says nothing about the value; it says "you can grab it here", and a
 * grab is where the hand already is. The position is one CSS custom
 * property written straight to the element on `pointermove` — no React
 * state, because a mousemove is not a reason to render — and a utility
 * class reads it back, so nothing here is an inline `top` a responsive rule
 * could not override.
 *
 * A keyboard has no cursor to follow, so on focus the pill sits in the
 * middle: the property is cleared when the pointer leaves, and the utility's
 * fallback is the centre. That is the one place this departs from the
 * prototype, which showed nothing to a keyboard at all.
 */

const handle = tv({
  base: [
    'group/handle relative flex shrink-0 rounded-sm',
    // Without this a drag on a touch device scrolls the page instead.
    'touch-none select-none',
    'hover:bg-surface-overlay-subtle transition-colors duration-fast-min ease-standard',
    ...focusRing,
  ],
  variants: {
    orientation: {
      // The line is vertical: it sits between two blocks and resizes width.
      vertical: 'h-full w-3 cursor-col-resize',
      // The line is horizontal: it sits under a row and resizes height.
      horizontal: 'h-3 w-full cursor-row-resize',
    },
  },
})

const pill = tv({
  base: [
    'bg-surface-border-emphasized absolute rounded-full opacity-0',
    // Opacity and the position along the strip both ease; the position is
    // what makes the pill *slide* after the pointer rather than jump to it.
    'transition-[opacity,top,left] duration-fast-min ease-standard',
    'group-hover/handle:opacity-100 group-focus-visible/handle:opacity-100',
  ],
  variants: {
    orientation: {
      // `--pill-offset` is where the pointer is along the strip; without it,
      // the middle — which is where a keyboard finds it.
      vertical: 'left-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2 top-(--pill-offset,50%)',
      horizontal: 'top-1/2 h-1 w-10 -translate-x-1/2 -translate-y-1/2 left-(--pill-offset,50%)',
    },
  },
})

/** Half the pill's length: the pill stays inside the strip rather than hanging off its ends. */
const PILL_REACH = 20

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
  /**
   * A pointer drag has begun. Not fired for a keystroke: a caller uses the
   * pair to hold a size transition off while the pointer is down.
   */
  onResizeStart?: () => void
  /** The pointer drag has ended. */
  onResizeEnd?: () => void
  /**
   * Which side of the handle the thing it sizes is on. `before`, the default,
   * is the block to the left or above — the rail, a table column, a row:
   * moving the handle toward the end grows it. `after` is the block to the
   * right or below — a `Panel` on the far side of the page, whose handle sits
   * on its *near* edge — where moving toward the start grows it. Either way
   * an arrow key moves the separator in the arrow's direction, which is what a
   * separator's arrows are for; the value follows the block.
   */
  sized?: 'before' | 'after'
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
  onResizeStart,
  onResizeEnd,
  sized = 'before',
  className,
}: ResizeHandleProps) {
  const start = useRef<{ at: number; value: number; unit: number } | null>(null)
  const vertical = orientation === 'vertical'
  const after = sized === 'after'

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
      Capture, so the pointer can leave the 12px strip mid-drag — which it
      will, because a fast drag outruns the block it is widening — and the
      moves keep arriving here instead of at whatever is under the cursor.
    */
    /*
      Guarded, because a pointer that is not active cannot be captured and the
      call throws — which a real press never is, and a synthetic one (a test's
      `userEvent.pointer`) always is. Without capture the drag still works
      while the pointer stays on the strip, which is all a test needs.
    */
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // No active pointer to capture; see above.
    }
    event.preventDefault()
    onResizeStart?.()
  }

  /*
    Where along the strip the pointer is, clamped so the pill never hangs off
    either end. Written to the element directly: a mousemove is not a reason
    to render, and the class reads the property back on the next paint.
  */
  function followPointer(event: ReactPointerEvent<HTMLSpanElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const along = vertical ? event.clientY - rect.top : event.clientX - rect.left
    const length = vertical ? rect.height : rect.width
    const offset = Math.max(PILL_REACH, Math.min(length - PILL_REACH, along))
    event.currentTarget.style.setProperty('--pill-offset', `${Math.round(offset)}px`)
  }

  function handlePointerLeave(event: ReactPointerEvent<HTMLSpanElement>) {
    // Back to the middle for the keyboard; the pill has faded out by then.
    if (!start.current) event.currentTarget.style.removeProperty('--pill-offset')
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLSpanElement>) {
    followPointer(event)
    if (!start.current) return
    const travelled = (vertical ? event.clientX : event.clientY) - start.current.at
    // A block after the handle grows when the handle moves toward the start.
    const signed = after ? -travelled : travelled
    const next = clamp(start.current.value + signed / start.current.unit)
    if (next !== value) onResize(next)
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLSpanElement>) {
    if (!start.current) return
    start.current = null
    /*
      The browser releases capture on its own at pointerup; this is for a
      cancel. Guarded, because releasing a pointer that is no longer active
      throws, and the caller's `onResizeEnd` has to run either way — a rail
      left with its transition off is worse than a capture left to expire.
    */
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    onResizeEnd?.()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    const by = event.shiftKey ? largeStep : step
    const toEnd = vertical ? 'ArrowRight' : 'ArrowDown'
    const toStart = vertical ? 'ArrowLeft' : 'ArrowUp'
    const grow = after ? toStart : toEnd
    const shrink = after ? toEnd : toStart
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
      onPointerEnter={followPointer}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerUp={handlePointerUp}
      // A touch the browser takes back for a scroll ends the drag the same way.
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      className={cn(handle({ orientation }), className)}
    >
      <span aria-hidden="true" className={pill({ orientation })} />
    </span>
  )
}

ResizeHandle.displayName = 'ResizeHandle'
