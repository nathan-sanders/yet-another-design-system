/** A portfolio's tabs, in the file's order (`Plan - Portfolio / Store expansion`, `40006279:12996`). */
export const PORTFOLIO_TABS = [
  { id: 'projects', label: 'Projects' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'updates', label: 'Updates' },
] as const

export type PortfolioTab = (typeof PORTFOLIO_TABS)[number]['id']

export function portfolioPath(id: string, tab: PortfolioTab = 'projects'): string {
  return `/plan/portfolios/${id}/${tab}`
}

/** The project whose Latest status panel is open beside a portfolio: `?project=austin`. */
export const STATUS_PARAM = 'project'
