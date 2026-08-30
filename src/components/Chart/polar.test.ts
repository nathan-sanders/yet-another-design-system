import { describe, expect, it } from 'vitest'

import {
  DONUT_INNER_RATIO,
  HALO_GAP,
  HALO_THICKNESS,
  RADIAL_INNER_RATIO,
  RADIAL_MARGIN,
  RADIAL_TRACK_GAP,
  donutRadius,
  gaugeGeometry,
  radialGeometry,
} from './polar'

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

describe('radialGeometry', () => {
  /**
   * The drawn edges of ring `index`, counting outward from the hole.
   *
   * Recharts divides `outerRadius - innerRadius` into one band per row and
   * centers each bar in its band, so this is the arithmetic the component is
   * relying on — written out here rather than assumed, because the equivalent
   * assumption about `barCategoryGap` is what put the grouped bars at 7px.
   */
  const ring = (g: ReturnType<typeof radialGeometry>, count: number, index: number) => {
    const band = (g.outerRadius - g.innerRadius) / count
    const inner = g.innerRadius + index * band + (band - g.barSize) / 2
    return { inner, outer: inner + g.barSize }
  }

  it('reproduces the file at five rings in a 256px box', () => {
    // `_Radial / Radial` (40004450:16871) draws bands of 16 and gaps of 4 over a
    // hole of 32, against a radius of 128.
    //
    // **The proportions reproduce; the absolute radius does not, and cannot.**
    // Recharts insists on half a gap outside the outermost bar where Figma sits
    // flush to the edge, so the chart gives up RADIAL_MARGIN of radius to make
    // room for it. Everything below is the file's rule applied to the radius
    // that is actually available.
    const g = radialGeometry(256, 256, 5)

    expect(g.ringOuter).toBe(128 - RADIAL_MARGIN)
    expect(g.ringInner).toBe(g.ringOuter * RADIAL_INNER_RATIO)
    // The band lands within a pixel of the file's 16 even after that.
    expect(g.barSize).toBeCloseTo(16, 0)

    const first = ring(g, 5, 0)
    const last = ring(g, 5, 4)
    // The extremes land on the hole and the edge — no half-gap of padding, which
    // is the whole reason the range handed to Recharts is inflated.
    expect(first.inner).toBeCloseTo(g.ringInner, 6)
    expect(last.outer).toBeCloseTo(g.ringOuter, 6)
    // And the gap between two neighbours is the file's 4.
    expect(ring(g, 5, 1).inner - first.outer).toBeCloseTo(RADIAL_TRACK_GAP, 6)
  })

  it('keeps every ring inside the box, at any count', () => {
    for (const [w, h] of [
      [896, 280],
      [400, 400],
      [280, 280],
      [1200, 200],
    ]) {
      for (const count of [1, 2, 3, 5, 8, 12]) {
        const g = radialGeometry(w, h, count)
        expect(g.barSize).toBeGreaterThan(0)

        // Nothing is drawn outside the box, in either direction.
        expect(ring(g, count, count - 1).outer).toBeLessThanOrEqual(Math.min(w, h) / 2)
        // And nothing is drawn inside the hole.
        expect(ring(g, count, 0).inner).toBeGreaterThanOrEqual(g.ringInner - 1e-6)
      }
    }
  })

  it('holds the hole at a quarter of the radius, whatever the count', () => {
    // The rule the one drawing had to be read as. A band thickness that changed
    // with the count *and* a hole that changed with it cannot both be true.
    for (const count of [1, 4, 9]) {
      const g = radialGeometry(400, 400, count)
      expect(g.ringInner / g.ringOuter).toBeCloseTo(RADIAL_INNER_RATIO, 6)
    }
  })

  it('reports zero before measurement rather than a negative radius', () => {
    expect(radialGeometry(0, 280, 5).barSize).toBe(0)
    expect(radialGeometry(400, 0, 5).barSize).toBe(0)
    expect(radialGeometry(400, 280, 0).barSize).toBe(0)
    // A box too small to hold the rings it was asked for, rather than bars of a
    // negative thickness.
    expect(radialGeometry(24, 24, 12).barSize).toBe(0)
  })
})
