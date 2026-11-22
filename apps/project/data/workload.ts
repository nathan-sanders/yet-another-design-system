/**
 * How booked everyone is, as Plan - Workload draws it (`40006279:21820`,
 * `40006299:28257`, `40006299:29363`) and the Roadmap's Capacity rows
 * (`40006297:28703`) summarize it. The numbers are cross-checked: a team's
 * week is its people's hours over their capacity (Ops the week of Nov 9 is
 * Marcus's 52 and Dana's 37 over 80, so 111%), and Marcus's 52 is 40 plus
 * the 12 hours of Signage install prep that Yak moves to Maya.
 */

/** One person on the Workload grid. */
export interface PersonLoad {
  personId: string
  /** Hours a week they can give: Priya works four days. */
  capacity: number
  /** The line under a name in the By team view: Construction lead. */
  title: string
  team: TeamId
  /**
   * Hours a day across the two weeks the People view shows, Monday Nov 2 to
   * Friday Nov 13 in the file's calendar, Monday first. `null` is a day off.
   */
  days: (number | null)[]
  /** Percent booked for the six weeks after those two, Nov 16 to Dec 21. */
  later: number[]
}

export type TeamId = 'ops' | 'marketing' | 'digital' | 'culinary' | 'people'

export const TEAMS: { id: TeamId; name: string }[] = [
  { id: 'ops', name: 'Ops' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'digital', name: 'Digital' },
  { id: 'culinary', name: 'Culinary' },
  { id: 'people', name: 'People' },
]

/** The first day the People view shows, as the file writes it: Monday of the file's week. */
export const WORKLOAD_START = '2026-11-02'

/** The task whose hours a rebalance moves: Signage install prep, AUS-41. */
export const REBALANCE_TASK = 'aus-41'

/**
 * The People view's rows, in the file's order — Austin crew. Marcus's second
 * week includes Signage install prep; `withoutRebalanceTask` below is his
 * week without it, and Maya's with it.
 */
export const loads: PersonLoad[] = [
  {
    personId: 'marcus',
    capacity: 40,
    title: 'Construction lead',
    team: 'ops',
    days: [8, 9, 7, 8, 8, 10, 11, 10, 12, 9],
    later: [96, 82, 84, 88, 90, 80],
  },
  {
    personId: 'dana',
    capacity: 40,
    title: 'Head of ops',
    team: 'ops',
    days: [8, 8, 7, 8, 7, 8, 7, 8, 8, 6],
    later: [92, 86, 88, 92, 94, 88],
  },
  {
    personId: 'sofia',
    capacity: 40,
    title: 'People lead',
    team: 'people',
    days: [6, 7, 6, 7, 6, 7, 6, 6, 7, 6],
    later: [82, 84, 96, 100, 78, 70],
  },
  {
    personId: 'priya',
    capacity: 32,
    title: 'Head chef',
    team: 'culinary',
    days: [6, 6, null, 6, 6, 6, 6, null, 6, 6],
    later: [70, 68, 66, 68, 70, 68],
  },
  {
    personId: 'katie',
    capacity: 40,
    title: 'Marketing lead',
    team: 'marketing',
    days: [7, 8, 7, 7, 7, 8, 7, 7, 8, 7],
    later: [92, 96, 98, 98, 94, 92],
  },
  {
    personId: 'maya',
    capacity: 40,
    title: 'Brand designer',
    team: 'marketing',
    days: [4, 3, 4, 3, 4, 4, 3, 4, 4, 3],
    later: [84, 88, 94, 98, 90, 88],
  },
  {
    personId: 'theo',
    capacity: 40,
    title: 'Product lead',
    team: 'digital',
    days: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
    later: [100, 100, 104, 106, 104, 102],
  },
]

/**
 * The second week's days once Signage install prep changes hands, as the
 * Rebalance preview draws them: Marcus drops from 52 to 40, Maya goes from
 * 18 to 30. Whoever holds the task gets the heavier week.
 */
export const rebalanced: Record<string, { holding: number[]; without: number[] }> = {
  marcus: { holding: [10, 11, 10, 12, 9], without: [8, 8, 8, 9, 7] },
  maya: { holding: [6, 6, 6, 6, 6], without: [4, 3, 4, 4, 3] },
}

/**
 * Share of each team's hours booked, a month a column, for the Roadmap's
 * Capacity rows: November first, the month of the file's today. People has
 * no row there; the file draws four teams.
 */
export const monthlyCapacity: { team: TeamId; months: number[] }[] = [
  { team: 'ops', months: [96, 88, 124, 102, 110, 80] },
  { team: 'marketing', months: [82, 94, 91, 70, 76, 88] },
  { team: 'digital', months: [100, 104, 92, 85, 78, 60] },
  { team: 'culinary', months: [72, 68, 80, 90, 96, 70] },
]

/**
 * What moving Dallas's start does to Ops: its January drops from 124% to
 * 104% once Dallas starts three weeks later, as the Capacity frame's Yak
 * line and the Apply dialog both say.
 */
export const DALLAS_RELIEF = { team: 'ops' as TeamId, month: 2, days: 21, to: 104 }
