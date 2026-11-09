import { projectFor } from '../data/projects'

/**
 * Bottom clearance for a page's scroll region, so its last row can scroll out
 * from behind the bar: the bar's 58, its 16 off the bottom, and 16 of air.
 * Only from `md`, because the bar is hidden on a phone.
 */
export const floatingYakClearance = 'md:pb-24'

/**
 * What the bar asks on each page, as the frames write it, or `null` where
 * there is no bar: Home opens on Yak's own composer.
 */
export function floatingYakPlaceholder(pathname: string): string | null {
  if (pathname === '/home') return null
  const projectId = pathname.match(/^\/projects\/([^/]+)/)?.[1]
  const project = projectId ? projectFor(projectId) : undefined
  if (project) return `Ask Yak about ${project.name}…`
  return 'Ask Yak, or search projects, tasks and people…'
}
