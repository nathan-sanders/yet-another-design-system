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

/** One row per slice, for Donut and Gauge. */
export function sliceData(count = 6): Record<string, unknown>[] {
  const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'Brave', 'Vivaldi', 'Arc']
  const values = [4820, 2140, 980, 620, 310, 180, 90, 40]
  return browsers.slice(0, count).map((name, i) => ({ browser: name, sessions: values[i] }))
}

/** Progress toward a target, for a Gauge. */
export function gaugeData(): Record<string, unknown>[] {
  return [
    { stage: 'Committed', amount: 62 },
    { stage: 'In progress', amount: 24 },
    { stage: 'Remaining', amount: 14 },
  ]
}

/** One row per dimension, several series — the shape a Radar wants. */
export function radarData(axes = 5): Record<string, unknown>[] {
  const names = ['Speed', 'Reliability', 'Comfort', 'Safety', 'Efficiency', 'Value']
  const seeds = [
    [88, 72, 64, 91, 55, 70],
    [64, 88, 78, 62, 84, 58],
    [72, 55, 92, 70, 66, 81],
  ]
  return names.slice(0, axes).map((name, i) => ({
    dimension: name,
    modelA: seeds[0][i],
    modelB: seeds[1][i],
    modelC: seeds[2][i],
  }))
}

/** A week by hour, for the heat map. Some cells are deliberately empty. */
export function heatMapData(): { rows: string[]; columns: string[]; values: (number | null)[][] } {
  const rows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const columns = Array.from({ length: 24 }, (_, h) =>
    h === 0 ? '12AM' : h === 12 ? '12PM' : String(h % 12),
  )
  const random = seeded(23)

  const values = rows.map((_, r) =>
    columns.map((_, c) => {
      // Quiet overnight and at weekends, busy mid-morning midweek — a shape a
      // reader can recognise, so a broken scale is obvious rather than plausible.
      const workday = r >= 1 && r <= 5 ? 1 : 0.35
      const hourly = Math.exp(-((c - 10) ** 2) / 40) + 0.15
      const value = Math.round(workday * hourly * 900 * (0.6 + random() * 0.8))
      // Genuinely sparse: quiet hours have *no* sessions rather than very few,
      // so the story actually exercises the empty-cell path Figma draws.
      return value < 130 ? null : value
    }),
  )

  return { rows, columns, values }
}

/** Three groups of tiles, for the tree map. */
export function treeMapData() {
  return [
    {
      key: 'organic',
      label: 'Organic',
      tiles: [
        { name: 'Search', value: 4200 },
        { name: 'Direct', value: 2600 },
        { name: 'Referral', value: 1100 },
      ],
    },
    {
      key: 'paid',
      label: 'Paid',
      tiles: [
        { name: 'Display', value: 2400 },
        { name: 'Video', value: 1500 },
        { name: 'Retarget', value: 700 },
        { name: 'Sponsor', value: 420 },
      ],
    },
    {
      key: 'social',
      label: 'Social',
      tiles: [
        { name: 'Threads', value: 1900 },
        { name: 'YouTube', value: 1250 },
        { name: 'LinkedIn', value: 800 },
        { name: 'Reddit', value: 380 },
      ],
    },
  ]
}
