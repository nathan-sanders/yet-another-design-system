import { CalendarX, CircleAlert, Inbox, Lightbulb, type LucideIcon } from 'lucide-react'

import { addDays, formatTime, sameDay } from '../data/dates'
import { customerFor, tickets } from '../data/inbox'
import { posts } from '../data/posts'
import { allRoutes } from '../shell/routes'
import { postDate, postsOn, today } from '../screens/calendar/model'

export interface Insight {
  icon: LucideIcon
  text: string
  /** The one-tap fix, when there is one. */
  action?: string
  /** Yak's canned answer when the fix is tapped. */
  answer?: string
}

/** What the start screen's insight card says: about the page Yak is beside. */
export interface PageBrief {
  /** The page it is about — `Calendar`, `All messages`, or the workspace. */
  page: string
  title: string
  insights: Insight[]
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
      answer:
        'I drafted two evergreen posts for that day: the Green Vitality Smoothie at 11 am on Instagram and a behind-the-counter Thread at 2 pm. They’re in the calendar as drafts for you to approve.',
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
      answer: `I moved one of the ${formatTime(crowded.time).replace(':00', '')} posts to 3 pm so they aren’t competing. Everything else stays put.`,
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

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`

/**
 * The inbox's rows, worked out from the open tickets the same way the
 * calendar's are from its posts: what is angry and unowned, how much has no
 * owner at all, and a question customers keep asking.
 */
export function inboxInsights(): Insight[] {
  const open = tickets.filter((t) => t.status !== 'complete')
  const unowned = open.filter((t) => !t.assigneeId)
  const insights: Insight[] = []

  const urgent = unowned.filter((t) => t.sentiment === 'negative')
  if (urgent.length > 0) {
    const names = urgent.map(
      (t) => customerFor(t.customerId).name ?? `@${customerFor(t.customerId).handle}`,
    )
    insights.push({
      icon: CircleAlert,
      text: `${names.join(' and ')} ${urgent.length === 1 ? 'is' : 'are'} upset, and no one owns ${urgent.length === 1 ? 'that message' : 'those messages'} yet`,
      action: 'Assign them to me',
      answer: `Done: they’re assigned to you, and there’s a drafted reply waiting in each thread for you to review.`,
    })
  }

  insights.push({
    icon: Inbox,
    text: `${unowned.length} of ${open.length} open messages are unassigned`,
    action: 'Route the rest',
    answer: `I split the other unassigned messages between Katie and Dana by network, so nobody gets two threads with the same customer.`,
  })

  const protein = open.filter((t) => /protein/i.test(t.subject))
  if (protein.length > 1) {
    insights.push({
      icon: Lightbulb,
      text: `${protein.length} people asked about protein this week — worth a Protein Plates FAQ before the launch`,
    })
  }
  return insights
}

/** The brief for whatever page is open: its own insights, or a workspace roundup. */
export function pageBrief(pathname: string): PageBrief {
  if (pathname.startsWith('/plan/calendar')) {
    return {
      page: 'Calendar',
      title: `Next 7 days · ${weekRange()}`,
      insights: weekInsights(),
    }
  }
  if (pathname.startsWith('/engage/')) {
    const page = allRoutes.find((route) => pathname.startsWith(route.path))?.label ?? 'Inbox'
    const open = tickets.filter((t) => t.status !== 'complete').length
    return {
      page,
      title: `${plural(open, 'open message')}`,
      insights: inboxInsights(),
    }
  }
  // A page Yak has nothing of its own to say about: the top of each one it does.
  return {
    page: 'Veggie Vault',
    title: 'Across your workspace',
    insights: [weekInsights()[0], inboxInsights()[0]].filter((i): i is Insight => Boolean(i)),
  }
}

/** Every insight any page can show, for finding a tapped fix's answer. */
export function allInsights(): Insight[] {
  return [...weekInsights(), ...inboxInsights()]
}

/** What Yak "does" for a question asked beside a page: the thought row's phrases, steps and summary. */
export interface PageWork {
  phrases: string[]
  steps: [done: string, last: string]
  summary: string
}

export function pageWork(pathname: string): PageWork {
  if (pathname.startsWith('/plan/calendar')) {
    return {
      phrases: ['Reading your calendar', 'Checking reach by day', 'Drafting'],
      steps: [`Read the calendar · ${weekRange()}`, 'Checked reach by day and hour'],
      summary: 'Checked the calendar against your audience',
    }
  }
  if (pathname.startsWith('/engage/')) {
    return {
      phrases: ['Reading the inbox', 'Checking who owns what', 'Drafting'],
      steps: ['Read the open messages', 'Checked owners and sentiment'],
      summary: 'Checked the inbox for what needs you',
    }
  }
  return {
    phrases: ['Looking across the workspace', 'Checking the calendar and inbox', 'Drafting'],
    steps: [`Read the calendar · ${weekRange()}`, 'Read the open messages'],
    summary: 'Looked across the calendar and inbox',
  }
}
