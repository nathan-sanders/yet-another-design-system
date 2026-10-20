import { me } from '../../data/people'

type Line = (name: string) => string

/** Fit any hour, any day. */
const ANYTIME: Line[] = [
  (n) => `Welcome back, ${n}`,
  (n) => `Ready when you are, ${n}`,
  (n) => `Let’s make some noise, ${n}`,
  (n) => `The feed’s been busy, ${n}`,
  (n) => `Your audience missed you, ${n}`,
  (n) => `What’s on the menu today, ${n}?`,
  (n) => `Let’s get posting, ${n}`,
  (n) => `Back at it, ${n}`,
]

const MORNING: Line[] = [
  (n) => `Coffee’s on, ${n}`,
  (n) => `Rise and post, ${n}`,
  (n) => `Fresh start, ${n}`,
]

const AFTERNOON: Line[] = [
  (n) => `Afternoon check-in, ${n}`,
  (n) => `Halfway there, ${n}`,
  (n) => `Lunch rush is over, ${n}`,
]

const EVENING: Line[] = [
  (n) => `Evening shift, ${n}?`,
  (n) => `One more look before tonight, ${n}?`,
]

const LATE: Line[] = [
  (n) => `Burning the midnight oil, ${n}?`,
  (n) => `The night owls are posting too, ${n}`,
]

/** Sunday first, as `Date.getDay()` counts. */
const WEEKDAY: Line[][] = [
  [(n) => `Sunday planning, ${n}?`],
  [(n) => `New week, new posts, ${n}`],
  [],
  [(n) => `Midweek already, ${n}`],
  [],
  [(n) => `Almost the weekend, ${n}`],
  [(n) => `Working the weekend, ${n}?`],
]

function forHour(hour: number): Line[] {
  if (hour < 5) return LATE
  if (hour < 12) return MORNING
  if (hour < 17) return AFTERNOON
  if (hour < 22) return EVENING
  return LATE
}

/**
 * Home's welcome line, in place of a plain "Good morning". It is drawn from
 * lines that fit any time, the hour's lines and the day's. A reload keeps the
 * same line; it changes when the part of the day does (morning to afternoon)
 * and from one day to the next.
 */
export function welcome(now = new Date()): string {
  const name = me.name.split(' ')[0]!
  const lines = [...ANYTIME, ...forHour(now.getHours()), ...WEEKDAY[now.getDay()]!]
  const day = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
      Date.UTC(now.getFullYear(), 0, 0)) /
      86_400_000,
  )
  // A step of 7, prime to every list length here (10 to 12), so neighboring
  // days land far apart instead of walking through the list in order.
  return lines[(day * 7) % lines.length]!(name)
}
