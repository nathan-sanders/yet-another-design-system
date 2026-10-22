/**
 * What the floating Yak bar says, and does, on each page.
 *
 * `search` pages (Discover, Creators) answer with results, the way their
 * in-page search bars used to; everywhere else a question starts a chat. Both
 * open in Yak's full view, which minimizes to the panel — except where the
 * page is itself an editor (`opens: 'panel'`): the composer and an idea's page
 * keep the work in view and open the panel beside it instead (FINDINGS 149).
 *
 * `null` is "no bar": Home has the composer in the page, Engage pins a reply box to the bottom of its pages, and
 * the full view has its own composer. The placeholders are this app's, not the
 * file's (FINDINGS 60) — Figma draws Discover's and Creators' and copies
 * Creators' onto the rest.
 */
export interface FloatingYakConfig {
  placeholder: string
  mode: 'ask' | 'search'
  /** Where the answer opens. The full view unless the page says otherwise. */
  opens?: 'panel' | 'full'
}

const PAGES: { prefix: string; config: FloatingYakConfig }[] = [
  {
    prefix: '/plan/calendar',
    config: { placeholder: 'Ask Yak to plan, draft or reschedule posts…', mode: 'ask' },
  },
  {
    prefix: '/plan/compose',
    config: { placeholder: 'Have Yak draft with you…', mode: 'ask', opens: 'panel' },
  },
  // Before `/plan/ideas`: a segment starting with `:` matches anything, so
  // this takes an idea's page and `new`, and the board falls through.
  {
    prefix: '/plan/ideas/:ideaId',
    config: { placeholder: 'Have Yak shape this idea…', mode: 'ask', opens: 'panel' },
  },
  {
    prefix: '/plan/ideas',
    config: { placeholder: 'Ask Yak for post ideas…', mode: 'ask' },
  },
  {
    prefix: '/plan/creators',
    config: { placeholder: 'Find the best creators for your brand…', mode: 'search' },
  },
  {
    prefix: '/measure/discover',
    config: {
      placeholder: 'Ask a question, or search topics, brands and creators…',
      mode: 'search',
    },
  },
  // Longest first: a widget is inside a report, which is inside Reports.
  {
    prefix: '/measure/reports/:report/widgets',
    config: { placeholder: 'Ask about this chart…', mode: 'ask' },
  },
  {
    prefix: '/measure/reports/:report',
    config: { placeholder: 'Ask about this report…', mode: 'ask' },
  },
  {
    prefix: '/measure/reports',
    config: { placeholder: 'Ask Yak to find or build a report…', mode: 'ask' },
  },
]

const FALLBACK: FloatingYakConfig = { placeholder: 'Ask Yak anything…', mode: 'ask' }

function matches(prefix: string, pathname: string): boolean {
  const want = prefix.split('/')
  const got = pathname.split('/')
  if (got.length < want.length) return false
  return want.every((part, i) => part.startsWith(':') || part === got[i])
}

export function floatingYakFor(pathname: string): FloatingYakConfig | null {
  // Home has the composer in the page, so a second box at the bottom would repeat it.
  if (pathname === '/home' || pathname.startsWith('/engage') || pathname.startsWith('/yak')) {
    return null
  }
  return PAGES.find((page) => matches(page.prefix, pathname))?.config ?? FALLBACK
}
