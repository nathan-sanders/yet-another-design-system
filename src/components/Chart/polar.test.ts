import { describe, expect, it } from 'vitest'

import { DONUT_INNER_RATIO, HALO_GAP, HALO_THICKNESS, donutRadius, gaugeGeometry } from './polar'

/**
 * The polar sizing, pinned.
 *
 * These exist because of a bug that only appeared **on hover**: the halo is
 * drawn outside the ring, and both charts sized themselves to fill their box
 * exactly, so it was cut off top and bottom. The gauge was clipped even at rest,
 * because its separator stroke straddles the outer edge.
 *
 * Every test below asserts the same property rather than a number — that
 * everything the chart draws, halo included, lands inside the box it was given.
 */

/** The furthest anything is drawn from the center. */
const drawnRadius = (outerRadius: number) => outerRadius + HALO_GAP + HALO_THICKNESS

describe('donutRadius', () => {
  it('leaves the halo room inside the box', () => {
    for (const [w, h] of [
      [896, 280],
      [400, 400],
      [280, 280],
      [1200, 200],
    ]) {
      const r = donutRadius(w, h)
      expect(r).toBeGreaterThan(0)
      // The halo has to fit in both directions, measuring from the center.
      expect(drawnRadius(r)).toBeLessThanOrEqual(Math.min(w, h) / 2)
    }
  })

  it('still leaves a ring worth looking at', () => {
    const r = donutRadius(400, 280)
    // The hole must not swallow the band.
    expect(r - r * DONUT_INNER_RATIO).toBeGreaterThan(8)
  })

  it('reports zero before measurement rather than a negative radius', () => {
    // Recharts renders a negative radius as an empty chart, so the caller needs
    // to be able to tell "not measured yet" from "measured, and small".
    expect(donutRadius(0, 280)).toBe(0)
    expect(donutRadius(896, 0)).toBe(0)
    expect(donutRadius(4, 4)).toBe(0)
  })
})

describe('gaugeGeometry', () => {
  it('sizes from half the width, not half the smaller dimension', () => {
    // The regression: Recharts' own rule would give 100 here, leaving the gauge
    // at roughly half the size it should be.
    const { outerRadius } = gaugeGeometry(400, 200)
    expect(outerRadius).toBeGreaterThan(150)
  })

  it('keeps the apex and its halo inside the box', () => {
    for (const [w, h] of [
      [400, 200],
      [896, 240],
      [300, 300],
      [200, 400],
    ]) {
      const { cy, outerRadius } = gaugeGeometry(w, h)
      expect(outerRadius).toBeGreaterThan(0)

      // Top: the apex sits at cy - r, and the halo reaches above it.
      expect(cy - drawnRadius(outerRadius)).toBeGreaterThanOrEqual(0)
      // Sides: measured from the horizontal center.
      expect(drawnRadius(outerRadius)).toBeLessThanOrEqual(w / 2)
      // Bottom: the flat ends and their stroke stay inside.
      expect(cy).toBeLessThan(h)
    }
  })

  it('reports zero before measurement', () => {
    expect(gaugeGeometry(0, 200).outerRadius).toBe(0)
    expect(gaugeGeometry(400, 0).outerRadius).toBe(0)
  })
})
