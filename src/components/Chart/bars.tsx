import type { ReactElement } from 'react'

import { accessibilityOverlay as accessibilityOverlayColor } from './palette'

/**
 * The bar segment, drawn by hand because Recharts cannot draw Figma's.
 *
 * Recharts' `Bar` takes a `radius`, and for a single bar that is enough. A
 * *stacked* bar is where it runs out: Figma rounds **every** segment on all four
 * corners and separates them with a gap, so a stack reads as a column of
 * discrete blocks rather than one bar with internal colour changes. Recharts
 * stacks segments flush and rounds only what you tell each `Bar` to round, with
 * no notion of a gap between them at all.
 *
 * So each segment is a custom `shape`. It is a rectangle, which is not much
 * code, and it buys the three things Figma's bars actually depend on.
 *
 * ## 1. The gap is made of surface, and comes off the top
 *
 * A 1px gap (Figma's `itemSpacing` on the stacked bar) separates touching
 * segments. It is taken off the **top** of every segment, and the exemption
 * belongs to the **topmost** one.
 *
 * That is worth stating carefully, because the intuitive answer is the wrong way
 * round and it looks fine on screen. Shrinking a segment's top opens the space
 * between it and whatever sits *above* it — so every segment needs it in order
 * to separate from its upper neighbour, and the top segment does not, since
 * there is nothing above it and shrinking it would understate the stack's total.
 *
 * Exempting the *bottom* segment instead — the first guess — leaves the lowest
 * two segments welded together with no gap at all, which a screenshot does not
 * show and a measurement does.
 *
 * Taking the gap off the top also keeps the stack anchored: the bottom
 * segment's lower edge is never touched, so the column stays welded to the
 * baseline. A stack floating a pixel clear of its zero reads as a rendering
 * fault.
 *
 * ## 2. The radius has to shrink for a short segment
 *
 * A 4px radius on a segment 5px tall produces a lozenge, and on a 2px one the
 * arcs overlap and SVG renders something arbitrary. A stacked chart has short
 * segments constantly — any small category — so this is the common case, not the
 * edge case. The radius is clamped to half the smaller dimension, which is the
 * point at which a rounded rectangle becomes a capsule and stops looking like a
 * mistake.
 *
 * ## 3. Negative values
 *
 * Recharts reports a bar below the axis with a negative `height` and a `y` at
 * its top. Normalising to a positive rectangle first means everything below
 * reads the same for both directions, and the gap still comes off the side
 * facing the rest of the stack.
 */

/** Figma's `Segment` corner radius. */
export const BAR_RADIUS = 4
/** Figma's `itemSpacing` between stacked segments. */
export const BAR_SEGMENT_GAP = 1
/**
 * Widest a bar is allowed to get. Figma's `Segment` is 16 for a single or
 * stacked bar and 24 inside a group; 24 is also the cap generic charting
 * guidance puts on a bar, and past it a bar stops reading as a measured length
 * and starts reading as a block of colour. The band's leftover is meant to be
 * air.
 */
export const BAR_MAX_WIDTH = 24

export interface BarSegmentProps {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
}

export interface BarSegmentOptions {
  /**
   * Whether this segment sits at the **top** of its stack — the one with nothing
   * above it to separate from, which therefore keeps its full height so the
   * stack's total stays accurate. Everything else gives up a pixel off its top.
   */
  isTop?: boolean
  /** Off for an unstacked bar, where there is nothing to separate from. */
  gap?: number
  /** Corner radius before clamping. */
  radius?: number
  /**
   * Draw the accessibility border around the segment.
   *
   * Three of the twelve categorical colours fall short of 3:1 on the light
   * canvas — yellow at 1.74:1 is the worst — and a large flat area of one of
   * them can be genuinely hard to find against the surface. This is the
   * sanctioned mitigation, and it is off by default because Figma's own bar
   * examples do not draw it: it is for the chart that needs it, not for every
   * chart in case.
   */
  accessibilityOverlay?: boolean
}

/**
 * Build a Recharts `shape` renderer for one series' segments.
 *
 * Returns a function rather than a component because Recharts calls `shape` per
 * datum, and the per-*series* facts — where it sits in the stack, whether there
 * is a gap — are known once, when the `<Bar>` is created.
 */
export function barSegment({
  isTop = true,
  gap = 0,
  radius = BAR_RADIUS,
  accessibilityOverlay = false,
}: BarSegmentOptions = {}) {
  return function renderBarSegment(props: BarSegmentProps): ReactElement {
    const rawWidth = props.width ?? 0
    const rawHeight = props.height ?? 0

    // Normalise a below-axis bar (negative height, y at its top) into a plain
    // positive rectangle before doing anything else.
    const width = Math.abs(rawWidth)
    const fullHeight = Math.abs(rawHeight)
    const x = rawWidth < 0 ? (props.x ?? 0) + rawWidth : (props.x ?? 0)
    const top = rawHeight < 0 ? (props.y ?? 0) + rawHeight : (props.y ?? 0)

    // Off the top, so the gap opens against the segment above and the bottom of
    // the stack stays welded to the baseline.
    const inset = isTop ? 0 : gap
    const height = Math.max(0, fullHeight - inset)
    const y = top + inset

    if (height <= 0 || width <= 0) return <g />

    const r = Math.max(0, Math.min(radius, width / 2, height / 2))

    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={r}
        ry={r}
        fill={props.fill}
        stroke={accessibilityOverlay ? accessibilityOverlayColor : undefined}
        strokeWidth={accessibilityOverlay ? 1 : undefined}
      />
    )
  }
}
