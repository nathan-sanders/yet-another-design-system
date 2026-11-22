import { projectFor } from '../data/projects'

/**
 * Bottom clearance for a page's scroll region, so its last row can scroll out
 * from behind the bar: the bar's 58, its 16 off the bottom, and 16 of air.
 * Only from `md`, because the bar is hidden on a phone.
 */
export const floatingYakClearance = 'md:pb-24'

/**
 * What the bar asks on each page, as the frames write it, or `null` where
 * there is no bar.
 */
export function floatingYakPlaceholder(pathname: string): string | null {
  // Home opens on Yak's own composer; the inbox's frames draw no bar over the
  // message, and none of the Requests frames draw one (the reply box and the
  // form's buttons sit where it would).
  if (pathname === '/home' || pathname.startsWith('/inbox') || pathname.startsWith('/requests'))
    return null
  // A doc's page draws none: the line under the doc is where you write, and Yak is in its bar.
  if (pathname.startsWith('/docs/')) return null
  if (pathname === '/docs') return 'Ask Yak to find or draft a doc…'
  const projectId = pathname.match(/^\/projects\/([^/]+)/)?.[1]
  const project = projectId ? projectFor(projectId) : undefined
  if (project) return `Ask Yak about ${project.name}…`
  if (pathname.startsWith('/my-work')) return 'Ask Yak about your work…'
  // Plan's, as each frame writes it.
  if (pathname.startsWith('/plan/roadmap')) return 'Ask Yak what this plan changes…'
  if (pathname.startsWith('/plan/workload')) return 'Ask Yak to rebalance the team…'
  if (pathname === '/plan/portfolios') return 'Ask Yak to compare your portfolios…'
  if (pathname.startsWith('/plan/portfolios/')) return 'Ask Yak about this portfolio…'
  if (pathname.startsWith('/plan/goals')) return 'Ask Yak how your goals are tracking…'
  return 'Ask Yak, or search projects, tasks and people…'
}
