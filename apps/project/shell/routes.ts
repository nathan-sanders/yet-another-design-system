import {
  ChartColumn,
  CircleCheck,
  ClipboardList,
  Compass,
  FileText,
  FolderKanban,
  House,
  Inbox,
  type LucideIcon,
} from 'lucide-react'

import { followed, projectFor } from '../data/projects'

/**
 * Every place the rail can take you, written once and read by the rail, the
 * phone sheet and `NotBuilt`. The order and the icons are the file's
 * (`Yet Project / Shell`, `40006259:45550`): Home, My work, Inbox (which
 * replaces Yet Social's bell), Projects ▾, Plan ▾, Requests, Docs, Reports.
 *
 * `figma` is the frame a route is drawn on; one with a frame and no `built`
 * flag is designed and not built yet.
 */
export interface AppRoute {
  path: string
  label: string
  icon?: LucideIcon
  badge?: number
  built?: boolean
  figma?: string
}

export interface RouteGroup {
  label: string
  icon: LucideIcon
  routes: AppRoute[]
}

export const home: AppRoute = {
  path: '/home',
  label: 'Home',
  icon: House,
  built: true,
  figma: '40006266-3768',
}

export const top: AppRoute[] = [
  home,
  { path: '/my-work', label: 'My work', icon: CircleCheck, figma: '40006266-4756' },
  { path: '/inbox', label: 'Inbox', icon: Inbox, badge: 4, figma: '40006278-12738' },
]

export const projectsGroup: RouteGroup = {
  label: 'Projects',
  icon: FolderKanban,
  routes: [
    { path: '/projects', label: 'All projects', built: true, figma: '40006264-1069' },
    ...followed.map((id) => ({
      path: `/projects/${id}`,
      label: projectFor(id)!.name,
      built: true,
      figma: '40006268-6554',
    })),
  ],
}

export const planGroup: RouteGroup = {
  label: 'Plan',
  icon: Compass,
  routes: [
    { path: '/plan/roadmap', label: 'Roadmap', figma: '40006278-14156' },
    { path: '/plan/portfolios', label: 'Portfolios', figma: '40006296-27641' },
    { path: '/plan/goals', label: 'Goals', figma: '40006279-15314' },
    { path: '/plan/workload', label: 'Workload', figma: '40006279-21820' },
  ],
}

export const bottom: AppRoute[] = [
  { path: '/requests', label: 'Requests', icon: ClipboardList, figma: '40006284-19161' },
  { path: '/docs', label: 'Docs', icon: FileText, figma: '40006283-18038' },
  { path: '/reports', label: 'Reports', icon: ChartColumn, figma: '40006283-21661' },
]

export const allRoutes: AppRoute[] = [
  ...top,
  ...projectsGroup.routes,
  ...planGroup.routes,
  ...bottom,
]

export const FIGMA_FILE =
  'https://www.figma.com/design/8bRBn0lf6TfPyFWR2XttDP/Yet-Another-Design-System'
