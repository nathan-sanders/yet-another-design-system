import { fromISODate, toISODate } from '../../data/dates'
import { defaultTimeOn } from '../calendar/drag'
import type { ScheduleAt } from '../calendar/scheduleState'

/**
 * `#/plan/compose?draft=d-1&from=…`: the composer, what it opened on, and the
 * page it goes back to.
 *
 * What it opened on is one of four things, and the query says which: a draft
 * to finish (`draft`), a scheduled post to edit (`post`), an idea to make a
 * post from (`idea`), or nothing but a day and maybe a time (`date`, `time`)
 * from a calendar's + — a new post on that day. When more than one is given
 * the first in that order wins; the others are ignored, not merged.
 */
export type ComposeSource =
  | { kind: 'new'; at: ScheduleAt | null }
  | { kind: 'draft'; draftId: string }
  | { kind: 'post'; postId: string }
  | { kind: 'idea'; ideaId: string }

export interface ComposeLink {
  draft?: string
  post?: string
  idea?: string
  date?: Date
  /** 24-hour `HH:MM`; only read with `date`. */
  time?: string
  /** The page to go back to. Left off when it is the calendar, the default. */
  from?: string
}

export const COMPOSE_PATH = '/plan/compose'
const DEFAULT_FROM = '/plan/calendar'

export function composePath({ draft, post, idea, date, time, from }: ComposeLink = {}): string {
  const params = new URLSearchParams()
  if (draft) params.set('draft', draft)
  else if (post) params.set('post', post)
  else if (idea) params.set('idea', idea)
  else if (date) {
    params.set('date', toISODate(date))
    if (time) params.set('time', time)
  }
  if (from && from !== DEFAULT_FROM) params.set('from', from)
  const query = params.toString()
  return `${COMPOSE_PATH}${query ? `?${query}` : ''}`
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

/**
 * Reads the source back out of the query. A bad `date` is no date; a bad
 * `time` is no time, and a date with no time goes out when a draft dropped on
 * that day would (`defaultTimeOn`) — or, once today's grid has run out, has no
 * time at all and the composer asks for one.
 */
export function parseCompose(params: URLSearchParams, now = new Date()): ComposeSource {
  const draft = params.get('draft')
  if (draft) return { kind: 'draft', draftId: draft }
  const post = params.get('post')
  if (post) return { kind: 'post', postId: post }
  const idea = params.get('idea')
  if (idea) return { kind: 'idea', ideaId: idea }
  const date = fromISODate(params.get('date'))
  if (!date) return { kind: 'new', at: null }
  const time = params.get('time')
  const chosen = time && TIME.test(time) ? time : defaultTimeOn(date, now)
  return { kind: 'new', at: chosen ? { date, time: chosen } : null }
}

/** Where the composer goes back to: the page it came from, or the calendar. */
export function composeFrom(params: URLSearchParams): string {
  const from = params.get('from')
  return from && from.startsWith('/') && !from.startsWith(COMPOSE_PATH) ? from : DEFAULT_FROM
}
