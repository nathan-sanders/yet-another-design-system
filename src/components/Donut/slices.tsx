import { Sector } from 'recharts'
import type { ReactElement } from 'react'

import { HALO_GAP, HALO_THICKNESS } from '../Chart'

/**
 * The hovered-slice shape, shared by Donut and Gauge.
 *
 * Figma draws the hover state as a **halo**: a thin arc of the series colour
 * sitting just outside the slice, 2px clear of the ring and 4px thick. The slice
 * itself does not change.
 *
 * That restraint is the point, and it is the usual mistake in a donut chart. The
 * common hover treatment grows the hovered slice — Recharts' own documentation
 * example does exactly that — and on a chart whose entire encoding is *size*,
 * enlarging the thing you point at makes it look like pointing changed its
 * value. The halo says "this one" without touching what the chart is measuring.
 */

interface SectorLikeProps {
  cx?: number
  cy?: number
  innerRadius?: number
  outerRadius?: number
  startAngle?: number
  endAngle?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
}

export function activeSliceShape(rawProps: unknown): ReactElement {
  // Recharts types `activeShape` against its own internal sector payload, which
  // carries far more than the eight geometry fields this needs. Narrowing here
  // keeps the shape function honest about what it actually reads.
  const { outerRadius = 0, ...rest } = rawProps as SectorLikeProps

  return (
    <g>
      <Sector {...rest} outerRadius={outerRadius} />
      <Sector
        {...rest}
        innerRadius={outerRadius + HALO_GAP}
        outerRadius={outerRadius + HALO_GAP + HALO_THICKNESS}
        // The halo is one continuous arc, so it takes no separator stroke of its
        // own — the slice beneath it already has one.
        stroke="none"
      />
    </g>
  )
}
