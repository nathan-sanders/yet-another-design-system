import type { ReactElement } from 'react'

import { accessibilityOverlay as accessibilityOverlayColor } from './palette'

/**
 * The bar segment, drawn by hand because Recharts cannot draw Figma's.
 *
 * Recharts' `Bar` takes a `radius`, and for a single bar that is enough. A
 * *stacked* bar is where it runs out: Figma rounds **every** segment on all four
 * corners and separates them with a gap, so a stack reads as a column of
 * discrete blocks rather than one bar with internal color changes. Recharts
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
 * to separate from its upper neighbor, and the top segment does not, since
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
 * its top. Normalizing to a positive rectangle first means everything below
 * reads the same for both directions. The gap is still taken off the far-from-
 * origin edge of the *normalized* rectangle, which is right for a positive
 * stack and would weld a stack that grows negative; both bar charts leave
 * negative stacks to Recharts' own domain, so that case is not drawn here.
 *
 * ## 4. The same segment on its side
 *
 * `HorizontalBar` is `VerticalBar` turned ninety degrees, and the segment turns
 * with it: `orientation: 'horizontal'` takes the gap off each segment's
 * **right** edge instead of its top, and the exemption belongs to the
 * **rightmost** segment. The left edge is never touched, so the row stays
 * welded to the zero baseline on the left — the same anchoring rule, one axis
 * over. Recharts calls this chart `layout="vertical"`, after its category axis;
 * the word here describes the bar.
 */

/** Figma's `Segment` corner radius. */
export const BAR_RADIUS = 4
/** Figma's `itemSpacing` between stacked segments. */
export const BAR_SEGMENT_GAP = 1
/**
 * Widest a bar is allowed to get. Figma's `Segment` is 16 for a single or
 * stacked bar and 24 inside a group; 24 is also the cap generic charting
 * guidance puts on a bar, and past it a bar stops reading as a measured length
 * and starts reading as a block of color. The band's leftover is meant to be
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
   * Whether this is the **outermost** segment of its stack — the top of a
   * column, or the right end of a row — the one with nothing beyond it to
   * separate from, which therefore keeps its full length so the stack's total
   * stays accurate. Everything else gives up a pixel off its outer edge.
   */
  isTop?: boolean
  /**
   * Which way the bar runs. Describes the *bar*, not Recharts' `layout`, which
   * names the category axis and so uses the opposite word.
   */
  orientation?: 'vertical' | 'horizontal'
  /** Off for an unstacked bar, where there is nothing to separate from. */
  gap?: number
  /** Corner radius before clamping. */
  radius?: number
  /**
   * Draw the accessibility border around the segment.
   *
   * Three of the twelve categorical colors fall short of 3:1 on the light
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
  orientation = 'vertical',
  gap = 0,
  radius = BAR_RADIUS,
  accessibilityOverlay = false,
}: BarSegmentOptions = {}) {
  return function renderBarSegment(props: BarSegmentProps): ReactElement {
    const rawWidth = props.width ?? 0
    const rawHeight = props.height ?? 0

    // Normalize a below-axis bar (negative height, y at its top) into a plain
    // positive rectangle before doing anything else.
    const fullWidth = Math.abs(rawWidth)
    const fullHeight = Math.abs(rawHeight)
    const x = rawWidth < 0 ? (props.x ?? 0) + rawWidth : (props.x ?? 0)
    const top = rawHeight < 0 ? (props.y ?? 0) + rawHeight : (props.y ?? 0)

    // Off the outer edge, so the gap opens against the next segment out and the
    // baseline edge of the stack is never touched: the top of a column, the
    // right end of a row.
    const inset = isTop ? 0 : gap
    const horizontal = orientation === 'horizontal'
    const height = horizontal ? fullHeight : Math.max(0, fullHeight - inset)
    const y = horizontal ? top : top + inset
    const width = horizontal ? Math.max(0, fullWidth - inset) : fullWidth

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

/** A row of a horizontal bar chart: Table's row height, so a list of bars sits at a list's rhythm. */
export const BAR_ROW_HEIGHT = 32
/** A bar inside a horizontal group: Figma's `Segment` thickness, and the floor the row is sized to keep. */
export const BAR_GROUP_THICKNESS = 16
/** Recharts' default x-axis height plus the plot's 4px top margin. */
const HORIZONTAL_BAR_CHROME = 34
/** Figma's gap between the bars of one group — `barGap`. */
export const BAR_GROUP_GAP = 4
/** `barCategoryGap` for a grouped chart, as a fraction Recharts takes off *each* side of the band. */
const GROUPED_CATEGORY_GAP = 0.1

/**
 * How tall a `HorizontalBar` is when the caller does not say.
 *
 * A horizontal bar's height is a function of how many rows it has, the way a
 * table's is — the chart exists for the case where every category needs its
 * own labeled row, and a fixed height would thin those rows out exactly when
 * there were most of them. Single and stacked rows take Table's 32; a grouped
 * row is sized so each of its `n` bars, after `barGap` and the 20% of the band
 * that `barCategoryGap` spends on air, still reaches Figma's 16.
 */
export function horizontalBarHeight(
  rows: number,
  { seriesCount = 1, stacked = false }: { seriesCount?: number; stacked?: boolean } = {},
): number {
  const grouped = !stacked && seriesCount > 1
  const row = grouped
    ? Math.ceil((BAR_GROUP_THICKNESS * seriesCount + BAR_GROUP_GAP * (seriesCount - 1)) / (1 - 2 * GROUPED_CATEGORY_GAP))
    : BAR_ROW_HEIGHT
  return Math.max(1, rows) * row + HORIZONTAL_BAR_CHROME
}
