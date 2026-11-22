/**
 * Mobile ordering app's sprints, two weeks each from a Monday to the Friday
 * after, in the file's calendar (`day()` moves them onto this week). Sprint
 * 14 is the one `Project - Sprint` (`40006281:34376`) draws; the three before
 * it are finished, and their counts make the frame's "Average pace: 8 tasks
 * a sprint" and "2 from Sprint 13". Their tasks are not in the mock.
 */
export interface Sprint {
  projectId: string
  number: number
  start: string
  end: string
  /** How a finished sprint ended: done of planned. */
  result?: { done: number; total: number }
}

export const sprints: Sprint[] = [
  {
    projectId: 'mobile-ordering',
    number: 11,
    start: '2026-09-21',
    end: '2026-10-02',
    result: { done: 7, total: 9 },
  },
  {
    projectId: 'mobile-ordering',
    number: 12,
    start: '2026-10-05',
    end: '2026-10-16',
    result: { done: 9, total: 10 },
  },
  {
    projectId: 'mobile-ordering',
    number: 13,
    start: '2026-10-19',
    end: '2026-10-30',
    result: { done: 8, total: 10 },
  },
  { projectId: 'mobile-ordering', number: 14, start: '2026-11-02', end: '2026-11-13' },
]
