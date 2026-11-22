/**
 * What Reports reads that the tasks alone can't give it: six months of
 * delivery history, the company's open work by team, and the budgets.
 * Overdue work is the exception — Reports counts it off the live tasks, so
 * the table, the bar and the drill-in agree with the List.
 *
 * The history is a weekly pattern rather than numbers typed per day, chosen
 * so the frame's 30 days come out as drawn (`Reports - Delivery`,
 * `40006283:21661`): 184 tasks done against 165 the month before (+12%).
 */

/** Tasks done on each weekday, Monday first: the last 30 days, and before that. */
export const completedByWeekday = {
  recent: [7, 8, 10, 10, 3, 1, 2],
  earlier: [6, 7, 9, 9, 4, 1, 2],
}

/**
 * Overdue tasks at the end of each day, by days ago (index 0 is unused: today
 * is the live count), back to 30 days ago, when five were late: the frame's
 * +2. The step up at the end is the permit's paperwork.
 */
export const overdueHistory: number[] = [
  0, 6, 6, 4, 4, 4, 4, 5, 5, 5, 5, 5, 4, 4, 4, 4, 5, 5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 3, 4, 4, 5,
]

/** Overdue a day further back than the history runs: a slow wave between 4 and 5. */
export function overdueBefore(daysAgo: number): number {
  return daysAgo % 9 < 4 ? 4 : 5
}

/**
 * The parts of a range's numbers that are rates and times, not counts: the
 * on-time rate and the average cycle time, now and against the range before.
 */
export const rates: Record<
  7 | 30 | 90,
  { onTime: number; onTimeWas: number; cycle: number; cycleWas: number }
> = {
  7: { onTime: 85, onTimeWas: 86, cycle: 4.0, cycleWas: 4.3 },
  30: { onTime: 87, onTimeWas: 84, cycle: 4.2, cycleWas: 4.8 },
  90: { onTime: 84, onTimeWas: 81, cycle: 4.6, cycleWas: 4.9 },
}

/** The teams the Open work chart lists, in its order, and who is on each. */
export const teams: { id: string; name: string; memberIds: string[]; open: number }[] = [
  { id: 'ops', name: 'Ops', memberIds: ['nathan', 'dana', 'marcus'], open: 38 },
  { id: 'digital', name: 'Digital', memberIds: ['theo'], open: 31 },
  { id: 'marketing', name: 'Marketing', memberIds: ['katie', 'maya'], open: 24 },
  { id: 'culinary', name: 'Culinary', memberIds: ['priya'], open: 17 },
  { id: 'people', name: 'People', memberIds: ['sofia'], open: 12 },
]

/**
 * `Reports - Budget` (`40006312:43935`): the four portfolios' numbers are
 * Plan's (`data/portfolios.ts`); these are their forecasts, and the projects
 * the file breaks out under them.
 */
export const portfolioForecasts: Record<string, number> = {
  'store-expansion': 1_550_000,
  menu: 130_000,
  digital: 560_000,
  'brand-people': 110_000,
}

export const projectBudgets: {
  projectId: string
  spent: number
  total: number
  forecast: number
}[] = [
  { projectId: 'austin', spent: 312_000, total: 480_000, forecast: 470_000 },
  { projectId: 'mobile-ordering', spent: 330_000, total: 360_000, forecast: 450_000 },
  { projectId: 'loyalty', spent: 80_000, total: 120_000, forecast: 110_000 },
]
