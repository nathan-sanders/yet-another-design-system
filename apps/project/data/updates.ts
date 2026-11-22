import { overviewFor } from './overview'
import type { ProjectHealth } from './types'

/**
 * A project's status update, as a portfolio shows them: the Latest status
 * panel (`Plan - Portfolio / Store expansion + Status`, `40006279:12996`)
 * and the Updates feed (`… / Updates`, `40006296:29615`). Austin's latest is
 * the one its Overview shows, so the two pages say the same thing; Dallas's
 * is the feed's. Dates are in the file's calendar, prose dates written
 * `{2026-11-10}` for `datedText`.
 */
export interface StatusUpdate {
  projectId: string
  authorId: string
  posted: string
  health: ProjectHealth
  body: string
  /** "Since last update", each a view-only Token. */
  changes: { kind: 'date' | 'people' | 'progress' | 'done'; text: string }[]
}

const austin = overviewFor('austin')!.latestUpdate

export const latestUpdates: StatusUpdate[] = [
  { projectId: 'austin', ...austin },
  {
    projectId: 'dallas',
    authorId: 'dana',
    posted: '2026-10-30',
    health: 'on-track',
    body: 'Lease is signed and the architect starts on the site plan next week.',
    changes: [{ kind: 'done', text: 'Sign Dallas lease: done' }],
  },
]

/** The panel's Earlier updates: one line each, the health first, newest first. */
export const earlierUpdates: {
  projectId: string
  authorId: string
  posted: string
  text: string
}[] = [
  {
    projectId: 'austin',
    authorId: 'dana',
    posted: '2026-10-26',
    text: 'On track · GM starts Monday, permits next',
  },
  {
    projectId: 'austin',
    authorId: 'dana',
    posted: '2026-10-12',
    text: 'On track · lease signed, kickoff next',
  },
]

/**
 * A project that should have posted and has not: the feed's "No update in
 * two weeks", with a Nudge for its owner. Houston is the file's.
 */
export const quietProjects: { projectId: string; quietFor: string }[] = [
  { projectId: 'houston', quietFor: 'two weeks' },
]

/** Yak's line over a portfolio's Updates, where the file writes one. */
export const updatesYakLine: Record<string, string> = {
  'store-expansion':
    'Austin slipped six days on permits, Dallas signed its lease, and Houston has gone quiet.',
}
