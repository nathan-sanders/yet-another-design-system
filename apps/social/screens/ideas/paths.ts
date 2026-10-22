/**
 * `#/plan/ideas/back-in-stalk?from=…`: an idea's page — where it is written
 * and edited (`Plan - Ideas / Idea / Full View`, `40006058:33896`) — and the
 * page it goes back to. `new` is a blank one.
 */
const BOARD = '/plan/ideas'

export const NEW_IDEA = 'new'

export function ideaPath(ideaId: string, from?: string): string {
  const params = new URLSearchParams()
  if (from && from !== BOARD) params.set('from', from)
  const query = params.toString()
  return `${BOARD}/${ideaId}${query ? `?${query}` : ''}`
}

export function newIdeaPath(from?: string): string {
  return ideaPath(NEW_IDEA, from)
}

/** Where the idea page goes back to: the page it came from, or the board. */
export function ideaFrom(params: URLSearchParams): string {
  const from = params.get('from')
  return from && from.startsWith('/') && !from.startsWith(`${BOARD}/`) ? from : BOARD
}
