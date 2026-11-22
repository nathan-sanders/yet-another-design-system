import { datedText } from './dates'
import type { ProjectHealth } from './types'

/**
 * A goal, as Plan - Goals (`40006279:15314`) lists them: four company goals
 * for H2 2026, three of them measured by the subgoals under them, and each
 * subgoal by the project that delivers it. The numbers are cross-checked on
 * the page: a goal's percent is the average of its subgoals' (59, 27, 71),
 * and a subgoal's is its project's.
 */
export interface Goal {
  id: string
  title: string
  ownerId: string
  /** In the file's calendar; `day()` moves it onto this week. */
  due: string
  /** The goal it ladders up to; none for a company goal. */
  parentId?: string
  /**
   * The project whose progress and health it reads. Sign Dallas lease is
   * linked to Dallas store opening on the map but is done whatever Dallas's
   * 8% says, so it carries a `manual` value as well.
   */
  projectId?: string
  /**
   * Several projects it averages, with its health the lowest of theirs — a
   * goal made with New goal's Measure progress from › Projects.
   */
  projectIds?: string[]
  /** A goal measured by hand: crew turnover's 64%, the signed lease's 100%. */
  manual?: { progress: number; health: ProjectHealth | 'done' }
  /** Every goal checks in on Friday; the property row says so. */
  checkIn: string
  /** Who is reminded to check in; the owner unless New goal said otherwise. */
  remindId?: string
  portfolioId?: string
}

export type GoalHealth = ProjectHealth | 'done'

export const goals: Goal[] = [
  {
    id: 'texas',
    title: 'Open 3 Texas stores',
    ownerId: 'dana',
    due: '2027-03-31',
    checkIn: 'Every Friday',
    portfolioId: 'store-expansion',
  },
  {
    id: 'open-austin',
    // The date in the title moves with the schedule, as prose dates do.
    title: datedText('Open Austin by {2027-01-12}'),
    ownerId: 'dana',
    due: '2027-01-12',
    parentId: 'texas',
    projectId: 'austin',
    checkIn: 'Every Friday',
    portfolioId: 'store-expansion',
  },
  {
    id: 'dallas-lease',
    title: 'Sign Dallas lease',
    ownerId: 'dana',
    due: '2026-10-30',
    parentId: 'texas',
    projectId: 'dallas',
    manual: { progress: 100, health: 'done' },
    checkIn: 'Every Friday',
    portfolioId: 'store-expansion',
  },
  {
    id: 'houston-site',
    title: 'Pick a Houston site',
    ownerId: 'marcus',
    due: '2027-02-26',
    parentId: 'texas',
    projectId: 'houston',
    checkIn: 'Every Friday',
    portfolioId: 'store-expansion',
  },
  {
    id: 'loyalty',
    title: 'Grow loyalty to 400K members',
    ownerId: 'theo',
    due: '2027-06-30',
    checkIn: 'Every Friday',
    portfolioId: 'digital',
  },
  {
    id: 'relaunch-loyalty',
    title: 'Relaunch the loyalty program',
    ownerId: 'theo',
    due: '2027-03-02',
    parentId: 'loyalty',
    projectId: 'loyalty',
    checkIn: 'Every Friday',
    portfolioId: 'digital',
  },
  {
    id: 'app-orders',
    title: 'Reach 30% of orders in the app',
    ownerId: 'theo',
    due: '2027-06-30',
    parentId: 'loyalty',
    projectId: 'mobile-ordering',
    checkIn: 'Every Friday',
    portfolioId: 'digital',
  },
  {
    id: 'aov',
    title: 'Raise average order value 8%',
    ownerId: 'katie',
    due: '2026-12-31',
    checkIn: 'Every Friday',
    portfolioId: 'menu',
  },
  {
    id: 'protein-plates',
    title: 'Launch Protein Plates',
    ownerId: 'katie',
    due: '2026-11-17',
    parentId: 'aov',
    projectId: 'protein-plates',
    checkIn: 'Every Friday',
    portfolioId: 'menu',
  },
  {
    id: 'seasonal-menus',
    title: 'Ship two seasonal menus',
    ownerId: 'priya',
    due: '2026-12-15',
    parentId: 'aov',
    projectId: 'winter-menu',
    checkIn: 'Every Friday',
    portfolioId: 'menu',
  },
  {
    id: 'turnover',
    title: 'Keep crew turnover under 60%',
    ownerId: 'sofia',
    due: '2026-12-31',
    manual: { progress: 64, health: 'on-track' },
    checkIn: 'Every Friday',
    portfolioId: 'brand-people',
  },
]

/** One check-in, newest first, as the goal panel's Check-ins list draws them. */
export interface CheckIn {
  id: string
  goalId: string
  authorId: string
  /** In the file's calendar. */
  posted: string
  text: string
  health?: GoalHealth
  /** Posted in this session: dated today rather than moved by `day()`. */
  fresh?: boolean
}

/** The three the file draws on Open 3 Texas stores (`40006279:18644`). */
export const checkIns: CheckIn[] = [
  {
    id: 'ci-texas-3',
    goalId: 'texas',
    authorId: 'dana',
    posted: '2026-10-30',
    text: 'Austin’s permit is the risk, Dallas lease is done',
    health: 'at-risk',
  },
  {
    id: 'ci-texas-2',
    goalId: 'texas',
    authorId: 'dana',
    posted: '2026-10-23',
    text: 'All three stores on plan',
    health: 'on-track',
  },
  {
    id: 'ci-texas-1',
    goalId: 'texas',
    authorId: 'nathan',
    posted: '2026-07-01',
    text: 'Set the goal for H2',
  },
]

export const TEXAS_GOAL = 'texas'
