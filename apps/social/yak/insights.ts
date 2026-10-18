import { CircleAlert, Lightbulb, CalendarX, type LucideIcon } from 'lucide-react'

import { addDays, formatTime, sameDay } from '../data/dates'
import { posts } from '../data/posts'
import { postDate, postsOn, today } from '../screens/calendar/model'

export interface Insight {
  icon: LucideIcon
  text: string
  /** The one-tap fix, when there is one. */
  action?: string
}

const fullWeekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
const monthShort = new Intl.DateTimeFormat('en-US', { month: 'short' })

/** `Thursday`, or `today` when it is. */
function dayName(day: Date): string {
  return sameDay(day, today) ? 'today' : fullWeekday.format(day)
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** Today and the six days after it — what Yak looks ahead over. */
function nextSevenDays(): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(today, i))
}

/**
 * `_Yak Insight` rows (`40005851:17822`), worked out from the posts in the
 * next seven days rather than typed in, so they stay true whatever day the
 * mock opens on. The file's three: an empty day, a crowded slot, and a launch
 * with a gap.
 */
export function weekInsights(): Insight[] {
  const days = nextSevenDays()
  const insights: Insight[] = []

  const empty = days.find((day) => postsOn(day).length === 0)
  if (empty) {
    const name = dayName(empty)
    insights.push({
      icon: CalendarX,
      text: `${capitalize(name)} is empty, and it’s your best day for reach`,
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
    const name = dayName(crowded.day)
    insights.push({
      icon: CircleAlert,
      text: `${capitalize(name)} has ${crowded.count} posts at ${formatTime(crowded.time).replace(':00', '')} competing for reach`,
      action: `Spread out ${name}`,
    })
  }

  const launch = posts.find((post) => post.id === 'p-12')
  if (launch) {
    insights.push({
      icon: Lightbulb,
      text: `Protein Plates launches ${dayName(postDate(launch))} with no Reel yet`,
    })
  }
  return insights
}

/** `Oct 17 – 23`, the range the insights cover. */
export function weekRange(): string {
  const days = nextSevenDays()
  const first = days[0]!
  const last = days[6]!
  const sameMonth = first.getMonth() === last.getMonth()
  return `${monthShort.format(first)} ${first.getDate()} – ${sameMonth ? '' : `${monthShort.format(last)} `}${last.getDate()}`
}
