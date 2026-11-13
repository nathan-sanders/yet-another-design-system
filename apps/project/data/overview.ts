import type { ProjectOverview } from './types'

/**
 * Austin store opening's Overview, as `Project - Overview` (`40006268:5150`)
 * draws it. The numbers agree with the rest of the app: 9 of 14 crew is the
 * crew task's checklist, 46% is the project's progress, the permit's Nov 18 is
 * the List's, and the inspection's slip from Nov 4 to Nov 10 is the "six
 * days behind" (FINDINGS 29).
 *
 * Only Austin has one; the other projects' come with their tasks.
 */
export const overviews: ProjectOverview[] = [
  {
    projectId: 'austin',
    summary: [
      'Permits are six days behind: the electrical inspection moved from {2026-11-04} to {2026-11-10}, and the health permit can’t start until it clears.',
      'The {2027-01-12} opening still holds if the permit clears by {2026-11-18}. After that, equipment delivery and training start to slip.',
      'Hiring is ahead of plan, with 9 of 14 crew signed.',
    ],
    latestUpdate: {
      authorId: 'dana',
      posted: '2026-11-02',
      health: 'at-risk',
      body: 'Inspection moved to the {2026-11-10:th} after the city rescheduled. Marcus is holding the hood install so we don’t pass inspection twice. I’ll know by Tuesday whether the permit date holds.',
      changes: [
        { kind: 'date', text: 'Electrical inspection: {2026-11-04} → {2026-11-10}' },
        { kind: 'people', text: 'Crew signed: 6 → 9 of 14' },
        { kind: 'progress', text: 'Progress: 38% → 46%' },
      ],
    },
    milestones: [
      {
        name: 'Health permit cleared',
        date: '2026-11-18',
        health: 'at-risk',
        timeline: 'Permit cleared',
      },
      { name: 'Crew hired', date: '2026-11-20', health: 'on-track' },
      {
        name: 'Training complete',
        date: '2026-12-14',
        health: 'on-track',
        timeline: 'Training done',
      },
      { name: 'Soft open', date: '2027-01-08', health: 'on-track', timeline: 'Soft open' },
      { name: 'Grand opening', date: '2027-01-12', health: 'on-track', timeline: 'Opening' },
    ],
    team: ['Ops', 'People', 'Marketing'],
    budget: { spent: 312_000, total: 480_000 },
    goal: 'Open 3 Texas stores',
    portfolio: 'Store expansion',
    activity: [
      { actorId: 'marcus', text: 'Marcus moved Electrical inspection to {2026-11-10}', age: '2h' },
      { actorId: 'sofia', text: 'Sofia marked Offer letters batch 2 as Done', age: '4h' },
      { actorId: 'katie', text: 'Katie requested your approval on the signage proof', age: '5h' },
      { actorId: 'priya', text: 'Priya commented on Finalize supplier list', age: '1d' },
      { actorId: 'dana', text: 'Dana posted an update: At risk', age: '3d' },
    ],
  },
]

export function overviewFor(projectId: string): ProjectOverview | undefined {
  return overviews.find((o) => o.projectId === projectId)
}
