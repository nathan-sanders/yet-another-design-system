import { addDays, day, shortDate } from '../../../data/dates'
import { personFor } from '../../../data/people'
import {
  loads,
  rebalanced,
  TEAMS,
  WORKLOAD_START,
  type PersonLoad,
  type TeamId,
} from '../../../data/workload'

/** The ten weekdays the People view shows: this week and next, Monday first. */
export function windowDays(): Date[] {
  const monday = day(WORKLOAD_START)
  return Array.from({ length: 10 }, (_, i) => addDays(monday, i < 5 ? i : i + 2))
}

/** The eight Mondays the By team view shows. */
export function windowWeeks(): Date[] {
  const monday = day(WORKLOAD_START)
  return Array.from({ length: 8 }, (_, i) => addDays(monday, i * 7))
}

/**
 * Someone's hours a day across the two weeks, with Signage install prep's
 * 12 hours in the second week of whoever `holder` is. Marcus has them as
 * drawn; once they move, Maya does.
 */
export function daysFor(load: PersonLoad, holder: string): (number | null)[] {
  const swap = rebalanced[load.personId]
  if (!swap) return load.days
  return [...load.days.slice(0, 5), ...(holder === load.personId ? swap.holding : swap.without)]
}

export function weekHours(days: (number | null)[], week: 0 | 1): number {
  return days.slice(week * 5, week * 5 + 5).reduce<number>((sum, h) => sum + (h ?? 0), 0)
}

/** Hours booked each of the eight weeks: the two drawn by the day, then the six by share. */
export function weeklyHours(load: PersonLoad, holder: string): number[] {
  const days = daysFor(load, holder)
  return [
    weekHours(days, 0),
    weekHours(days, 1),
    ...load.later.map((percent) => (percent * load.capacity) / 100),
  ]
}

export function weeklyShares(load: PersonLoad, holder: string): number[] {
  return weeklyHours(load, holder).map((hours) => Math.round((hours / load.capacity) * 100))
}

/**
 * A team's share each week: its people's hours over their capacity, so the
 * file's 111% for Ops the week of Nov 9 is (52 + 37) / 80, not the mean of
 * Marcus's 130 and Dana's 93.
 */
export function teamShares(team: TeamId, holder: string): number[] {
  const members = loads.filter((l) => l.team === team)
  const capacity = members.reduce((sum, m) => sum + m.capacity, 0)
  return Array.from({ length: 8 }, (_, week) => {
    const hours = members.reduce((sum, m) => sum + weeklyHours(m, holder)[week], 0)
    return Math.round((hours / capacity) * 100)
  })
}

export function teamMembers(team: TeamId): PersonLoad[] {
  return loads.filter((l) => l.team === team)
}

/**
 * The line under a name: this week's hours over capacity, then next week's
 * when it is worth saying — red when it is over, or when a pending
 * rebalance would change it (`40006299:28257`'s "· then 40h").
 */
export function weekSummary(
  load: PersonLoad,
  holder: string,
  preview?: string,
): { text: string; over: boolean } {
  const now = daysFor(load, holder)
  const next = preview ? daysFor(load, preview) : now
  const thisWeek = weekHours(now, 0)
  const nextWeek = weekHours(next, 1)
  const changed = preview !== undefined && weekHours(now, 1) !== nextWeek
  const over = !changed && nextWeek > load.capacity
  const base = `${thisWeek}h / ${load.capacity}h`
  return { text: over || changed ? `${base} · then ${nextWeek}h` : base, over }
}

/**
 * What Yak suggests (`Plan - Workload`, `40006279:21820`): when whoever
 * holds Signage install prep is over next week, and Maya has the room, the
 * 12 hours go to her. `null` once nobody is over.
 */
export function suggestion(holder: string): { text: string; to: string } | null {
  const load = loads.find((l) => l.personId === holder)
  if (!load || holder === 'maya') return null
  const over = weekHours(daysFor(load, holder), 1) - load.capacity
  if (over <= 0) return null
  return {
    text: `${personFor(holder).name.split(' ')[0]} is ${over} hours over next week. Moving Signage install prep to Maya evens it out.`,
    to: 'maya',
  }
}

/**
 * The preview's banner line (`Plan - Workload / Rebalance preview`): both
 * people's next weeks, before and after.
 */
export function previewSummary(from: string, to: string): { title: string; detail: string } {
  const a = loads.find((l) => l.personId === from)!
  const b = loads.find((l) => l.personId === to)!
  const first = (id: string) => personFor(id).name.split(' ')[0]
  const moved = weekHours(daysFor(a, from), 1) - weekHours(daysFor(a, to), 1)
  return {
    title: `Moves ${moved} hours to ${first(to)}`,
    detail: `${first(from)} drops from ${weekHours(daysFor(a, from), 1)}h to ${weekHours(daysFor(a, to), 1)}h next week. ${first(to)} goes from ${weekHours(daysFor(b, from), 1)}h to ${weekHours(daysFor(b, to), 1)}h, and no dates change.`,
  }
}

/**
 * Yak's line over the By team view (`40006299:29363`): the busiest team's
 * peak and whose it is, then any team that stays over 100% all of
 * December.
 */
export function teamsYakLine(holder: string): string {
  const weeks = windowWeeks()
  let peak = { team: '', value: 0, week: 0 }
  for (const t of TEAMS) {
    teamShares(t.id, holder).forEach((value, week) => {
      if (value > peak.value && value > 100 && teamMembers(t.id).length > 1)
        peak = { team: t.id, value, week }
    })
  }
  const sentences: string[] = []
  if (peak.team) {
    const name = TEAMS.find((t) => t.id === peak.team)!.name
    const members = teamMembers(peak.team as TeamId)
    const who = members
      .map((m) => ({ m, share: weeklyShares(m, holder)[peak.week] }))
      .sort((x, y) => y.share - x.share)[0]
    sentences.push(
      `${name} peaks at ${peak.value}% the week of ${shortDate.format(weeks[peak.week])}, and that’s all ${personFor(who.m.personId).name.split(' ')[0]}.`,
    )
  }
  const decemberFrom = weeks.findIndex((w) => w.getMonth() === 11)
  for (const t of TEAMS) {
    const shares = teamShares(t.id, holder)
    if (
      decemberFrom >= 0 &&
      shares.slice(decemberFrom).every((v) => v >= 100) &&
      shares.slice(decemberFrom).some((v) => v > 100)
    ) {
      sentences.push(`${t.name} stays above 100% through December.`)
    }
  }
  return sentences.join(' ') || 'Every team stays at or under 100% through December.'
}
