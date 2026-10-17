import { CircleAlert, Lightbulb, CalendarX, type LucideIcon } from 'lucide-react'

import { formatTime } from '../data/dates'
import { postsOn, today, weekDays } from '../screens/calendar/model'

export interface Insight {
  icon: LucideIcon
  text: string
  /** The one-tap fix, when there is one. */
  action?: string
}

/**
 * `_Yak Insight` rows (`40005851:17822`), worked out from this week's posts
 * rather than typed in, so they stay true whatever week the mock opens on.
 * The file's three: an empty day, a crowded slot, and a launch with a gap.
 */
export function weekInsights(): Insight[] {
  const days = weekDays(today)
  const insights: Insight[] = []

  const empty = days.find((day) => day >= today && postsOn(day).length === 0)
  if (empty) {
    const name = fullWeekday.format(empty)
    insights.push({
      icon: CalendarX,
      text: `${name} is empty, and it’s your best day for reach`,
      action: `Fill ${name}`,
    })
  }

  let crowded: { day: Date; time: string; count: number } | undefined
  for (const day of days) {
    const byTime = new Map<string, number>()
    for (const post of postsOn(day)) byTime.set(post.time, (byTime.get(post.time) ?? 0) + 1)
    for (const [time, count] of byTime) {
      if (count > 1 && (!crowded || count > crowded.count)) crowded = { day, time, count }
    }
  }
  if (crowded) {
    const name = fullWeekday.format(crowded.day)
    insights.push({
      icon: CircleAlert,
      text: `${name} has ${crowded.count} posts at ${formatTime(crowded.time).replace(':00', '')} competing for reach`,
      action: `Spread out ${name}`,
    })
  }

  insights.push({ icon: Lightbulb, text: 'Protein Plates launches Monday with no Reel yet' })
  return insights
}

const fullWeekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' })

/** `Jul 6 – 12`, the insight card's range. */
export function weekRange(): string {
  const [first, , , , , , last] = weekDays(today)
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' })
  const sameMonth = first!.getMonth() === last!.getMonth()
  return `${month.format(first)} ${first!.getDate()} – ${sameMonth ? '' : `${month.format(last)} `}${last!.getDate()}`
}
