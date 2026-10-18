import {
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  House,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react'

/**
 * Every place the nav can take you, written once and read by the rail, the phone
 * sheet and the router. The groups and their order are Figma's side navigation
 * (`40005911:32756`, `33580`, `34877`).
 *
 * `figma` is the screen the route is drawn on. A route with a frame and no
 * `built` flag is designed and not built yet; one with neither is not designed.
 */
export interface AppRoute {
  path: string
  label: string
  badge?: number
  built?: boolean
  figma?: string
}

export interface RouteGroup {
  label: string
  icon: LucideIcon
  routes: AppRoute[]
}

export const home: AppRoute & { icon: LucideIcon } = { path: '/home', label: 'Home', icon: House }

export const groups: RouteGroup[] = [
  {
    label: 'Plan',
    icon: CalendarDays,
    routes: [
      { path: '/plan/calendar', label: 'Calendar', built: true, figma: '40005911-32756' },
      { path: '/plan/campaigns', label: 'Campaigns' },
      { path: '/plan/ideas', label: 'Ideas', figma: '40005911-32981' },
      { path: '/plan/creators', label: 'Creators', figma: '40005911-35697' },
      { path: '/plan/assets', label: 'Asset library' },
      { path: '/plan/link-in-bio', label: 'Link in bio' },
    ],
  },
  {
    label: 'Engage',
    icon: MessageCircle,
    routes: [
      { path: '/engage/my-inbox', label: 'My inbox', built: true },
      { path: '/engage/all', label: 'All messages', badge: 503, built: true, figma: '40005911-33580' },
      { path: '/engage/assignments', label: 'All assignments', badge: 20 },
      { path: '/engage/comments', label: 'Comments by post' },
      { path: '/engage/approvals', label: 'Reply approvals' },
      { path: '/engage/spam', label: 'Spam' },
      { path: '/engage/teams', label: 'Team inboxes' },
      { path: '/engage/views', label: 'Views' },
    ],
  },
  {
    label: 'Measure',
    icon: ChartNoAxesColumnIncreasing,
    routes: [
      { path: '/measure/discover', label: 'Discover', figma: '40005911-35187' },
      { path: '/measure/reports', label: 'Reports', built: true, figma: '40005911-34877' },
      { path: '/measure/alerts', label: 'Alerts' },
    ],
  },
]

export const allRoutes: AppRoute[] = [home, ...groups.flatMap((g) => g.routes)]

export const FIGMA_FILE =
  'https://www.figma.com/design/8bRBn0lf6TfPyFWR2XttDP/Yet-Another-Design-System'
