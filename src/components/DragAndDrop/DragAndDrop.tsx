import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCorners,
  defaultDropAnimation,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DndContextProps,
  type DropAnimation,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { isKeyboardEvent } from '@dnd-kit/utilities'

import { overlayLayerIndex } from '../../lib/layers'
import { announcements, screenReaderInstructions } from './announcements'

/**
 * DragAndDrop — the root every sortable sits under.
 *
 * A wrapper over `@dnd-kit/core`'s `DndContext` that makes the library's
 * decisions once, so a board and a dashboard behave the same way without
 * either repeating them:
 *
 * - **Two sensors, not three.** A `PointerSensor` with a small activation
 *   distance, so a press that does not travel is still a click; a
 *   `KeyboardSensor` with the sortable coordinate getter, so the arrow keys
 *   step between items and containers. No `TouchSensor`: the pointer sensor
 *   already receives touch pointers, and the `DragHandle`'s `touch-none` is
 *   what decides whether a finger pans the page or carries the item.
 * - **`closestCorners`**, not `pointerWithin`. Pointer-within has nothing to
 *   measure on a keyboard drag, and never lands on an empty container because
 *   the carried item's rect does not overlap it. Corners does both.
 * - **Containers are measured continuously.** The default measures once when
 *   a drag starts, and a column that grew because a card was carried into it
 *   would then be aimed at from a stale rect.
 * - **The announcements read names**, from `announcements.ts`.
 *
 * Everything else on `DndContext` — the drag handlers above all — passes
 * through. This is the third motion-library candidate this library has
 * weighed and the first to earn its place; the root `CLAUDE.md` says why.
 */
export interface DragAndDropProps
  extends Omit<DndContextProps, 'sensors' | 'accessibility' | 'collisionDetection' | 'measuring'> {
  children: ReactNode
  /**
   * How far a pointer travels before a press becomes a drag, in px. Small
   * enough that a click never lifts, large enough that a trackpad tremor does
   * not either.
   */
  activationDistance?: number
  /** Override only when a layout needs to; `closestCorners` is right for lists, columns and grids. */
  collisionDetection?: CollisionDetection
}

const measuring = { droppable: { strategy: MeasuringStrategy.Always } }
const accessibility = { announcements, screenReaderInstructions }

export function DragAndDrop({
  children,
  activationDistance = 4,
  collisionDetection = closestCorners,
  ...props
}: DragAndDropProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: activationDistance } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={measuring}
      accessibility={accessibility}
      {...props}
    >
      {children}
    </DndContext>
  )
}

DragAndDrop.displayName = 'DragAndDrop'

/**
 * The tokens as numbers, read off the stylesheet at the moment they are
 * needed rather than written into JavaScript — the drop animation is a Web
 * Animations call, which takes milliseconds and a curve and cannot read a
 * `var()`. Under reduced motion there is no animation at all: the WAAPI does
 * not see `theme.css`'s clamp, so this is the one place the preference is
 * checked by hand.
 */
function tokenDropAnimation(): DropAnimation | null {
  if (typeof window === 'undefined') return null
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  const styles = getComputedStyle(document.documentElement)
  const duration = parseFloat(styles.getPropertyValue('--transition-duration-fast'))
  const easing = styles.getPropertyValue('--ease-standard').trim()
  return {
    ...defaultDropAnimation,
    duration: Number.isFinite(duration) ? duration : 0,
    easing: easing || defaultDropAnimation.easing,
  }
}

/** Keyboard drags move the overlay in steps; the step is a transition on the tokens. */
function overlayTransition(activatorEvent: Event | null) {
  return isKeyboardEvent(activatorEvent)
    ? 'transform var(--transition-duration-fast) var(--ease-standard)'
    : undefined
}

export interface DragAndDropOverlayProps {
  /** What to draw under the pointer — usually the same card the item renders. */
  children: ReactNode
}

/**
 * Opt-in. The carried item is normally the item itself, moved with a
 * transform: one element, one CSS transition, the tokens and the reduced-motion
 * rule for free. The one case that breaks is an item carried *out of* a
 * scroll container, which clips it at the edge. This portals a copy to
 * `<body>` on the library's overlay layer for that case, and animates the
 * drop with the same tokens read as numbers.
 *
 * The copy is a second element with the same accessible name for the length
 * of the drag, which is why it is not the default.
 */
function DragAndDropOverlay({ children }: DragAndDropOverlayProps) {
  const dropAnimation = useMemo(tokenDropAnimation, [])
  if (typeof document === 'undefined') return null
  return createPortal(
    <DragOverlay zIndex={overlayLayerIndex} dropAnimation={dropAnimation} transition={overlayTransition}>
      {children}
    </DragOverlay>,
    document.body,
  )
}

DragAndDropOverlay.displayName = 'DragAndDrop.Overlay'

DragAndDrop.Overlay = DragAndDropOverlay
