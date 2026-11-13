/**
 * My work's calendar (`My work - Calendar`, `40006315:49546`): the meetings
 * Nathan's week already holds, and the time he has blocked for his tasks.
 * Dates are the file's, so `day()` moves them onto this week with the tasks.
 * Hours are 24-hour and may be fractional: 9.5 is half past nine.
 */
export interface Meeting {
  id: string
  label: string
  date: string
  start: number
  end: number
}

/**
 * Time set aside for work. One block can cover two tasks — Thursday
 * afternoon's "Review signage and boards" is both approvals — and its color
 * is its first task's project's: purple for the menu boards, as drawn.
 */
export interface TimeBlock {
  id: string
  label: string
  date: string
  start: number
  end: number
  taskIds: string[]
}

/** Monday to Friday of the file's week, the days the calendar draws. */
export const FILE_WEEK = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06']

export const meetings: Meeting[] = [
  ...FILE_WEEK.map((date, i) => ({
    id: `standup-${i + 1}`,
    label: 'Austin standup',
    date,
    start: 9,
    end: 9.5,
  })),
  { id: 'portfolio-review', label: 'Portfolio review', date: '2026-11-03', start: 14, end: 15 },
]

export const timeBlocks: TimeBlock[] = [
  { id: 'b-ops', label: 'Ops budget', date: '2026-11-04', start: 11, end: 13, taskIds: ['ops-3'] },
  {
    id: 'b-landlord',
    label: 'Call the landlord',
    date: '2026-11-05',
    start: 10,
    end: 11,
    taskIds: ['aus-12'],
  },
  {
    id: 'b-supplier',
    label: 'Supplier list with Priya',
    date: '2026-11-05',
    start: 11,
    end: 12,
    taskIds: ['aus-29'],
  },
  {
    id: 'b-reviews',
    label: 'Review signage and boards',
    date: '2026-11-05',
    start: 14,
    end: 16,
    taskIds: ['pro-18', 'aus-31'],
  },
  {
    id: 'b-update',
    label: 'Write weekly update',
    date: '2026-11-06',
    start: 10,
    end: 11,
    taskIds: ['pro-21'],
  },
  {
    id: 'b-loyalty',
    label: 'Loyalty pricing model',
    date: '2026-11-06',
    start: 13,
    end: 15,
    taskIds: ['loy-14'],
  },
]

/**
 * The hours Nathan has free the rest of this week, as This week's group row
 * and Yak both say ("14h of work against 22h free"). The file states it; the
 * mock's calendar is one work week and cannot add it up (FINDINGS 57).
 */
export const FREE_HOURS = 22
