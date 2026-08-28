/**
 * Sample data for the chart stories.
 *
 * Shared across every chart story so the same numbers appear in each form and
 * the comparison between them is about the form, not the data. Generated from a
 * fixed seed rather than `Math.random()` — a story that redraws differently on
 * every render makes a visual regression test useless, and this library's tests
 * screenshot every story.
 */

/** A small deterministic PRNG (mulberry32). Same seed, same chart, every run. */
function seeded(seed: number): () => number {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface DailyRow extends Record<string, unknown> {
  date: string
  sessions: number
  signups: number
  conversions: number
}

/** `days` consecutive days from 1 January, three series, in the 100–2,000 band Figma draws. */
export function dailyData(days = 31, seed = 7): DailyRow[] {
  const random = seeded(seed)

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.UTC(2026, 0, 1 + i))
    return {
      date: date.toISOString(),
      sessions: Math.round(400 + random() * 1600),
      signups: Math.round(400 + random() * 1300),
      conversions: Math.round(100 + random() * 1700),
    }
  })
}

/** Twelve months, for the months x-axis preset. */
export function monthlyData(seed = 11): Record<string, unknown>[] {
  const random = seeded(seed)

  return Array.from({ length: 12 }, (_, i) => ({
    date: new Date(Date.UTC(2026, i, 1)).toISOString(),
    sessions: Math.round(8000 + random() * 12000),
    signups: Math.round(4000 + random() * 9000),
  }))
}

/** Twenty-four hours, for the hours preset. */
export function hourlyData(seed = 3): Record<string, unknown>[] {
  const random = seeded(seed)

  return Array.from({ length: 24 }, (_, i) => ({
    date: new Date(Date.UTC(2026, 0, 1, i)).toISOString(),
    sessions: Math.round(50 + random() * 450),
  }))
}
