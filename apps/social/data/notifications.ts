import {
  AtSign,
  Calendar,
  ChartNoAxesColumnIncreasing,
  ClipboardCheck,
  FileChartColumn,
  Inbox,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Reply,
  Sparkles,
  TriangleAlert,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'

import { postDate, today } from '../screens/calendar/model'
import type { DetailTab as PostDetailTab } from '../screens/calendar/postDetailState'
import { boardPath, widgetPath } from '../screens/reports/model'
import type { ShellPanel } from '../shell/ShellContext'
import { toISODate } from './dates'
import { customerFor } from './inbox'
import { posts } from './posts'
import type { Network } from './types'

/**
 * What a notification is about. Each has its own glyph on the avatar's Type
 * badge, as `_Notification Item` (`40005993:27689`) lists them.
 */
export type NotificationKind =
  | 'mention'
  | 'approval'
  | 'failed'
  | 'reply'
  | 'insight'
  | 'comments'
  | 'followers'
  | 'report-comment'
  | 'report'
  | 'assignment'
  | 'campaign'

export const KIND_ICON: Record<NotificationKind, LucideIcon> = {
  mention: AtSign,
  approval: ClipboardCheck,
  failed: TriangleAlert,
  reply: Reply,
  insight: Sparkles,
  comments: MessageCircle,
  followers: UserPlus,
  'report-comment': MessageSquare,
  report: FileChartColumn,
  assignment: Inbox,
  campaign: Megaphone,
}

/**
 * Who it came from. A person is an Avatar; anything no person sent — a network,
 * Yak, the brand's own account — is the file's Show Icon tile instead.
 */
export type NotificationSender =
  | {
      type: 'person'
      name: string
      /** Whose initials or photo the avatar shows, when `name` is more than a person. */
      avatarName?: string
      avatar?: string
      online?: boolean
    }
  | { type: 'network'; name: string; network: Network }
  | { type: 'yak' }

/**
 * Where a click goes: a path, a shell panel, or a path with the panel the next
 * screen opens with (`state.panel`, which `SocialShell` honors on a path change).
 */
export interface NotificationTarget {
  path?: string
  panel?: ShellPanel
}

export interface AppNotification {
  id: string
  group: 'today' | 'older'
  sender: NotificationSender
  kind: NotificationKind
  /** What they did: "Mentioned you on a post". */
  action: string
  /** As the file writes it: `3m`, `Sun`. */
  time: string
  /** The same, said in full for the row's accessible name. */
  spokenTime: string
  /** The thing it happened to, in the Card underneath. */
  card: { network?: Network; icon?: LucideIcon; title: string; description: string }
  /** The brand profile it belongs to, for the toolbar's filter. Reports have none. */
  profileId?: string
  unread: boolean
  target: NotificationTarget
}

function post(id: string) {
  const found = posts.find((p) => p.id === id)
  if (!found) throw new Error(`No post ${id}`)
  return found
}

/**
 * The calendar on the week a post sits in, with that post open beside it — on
 * a tab, at a note, when the notification is about one.
 */
function postTarget(id: string, at?: { tab: PostDetailTab; noteId?: string }): NotificationTarget {
  return {
    path: `/plan/calendar?view=week&date=${toISODate(postDate(post(id)))}`,
    panel: { type: 'post', postId: id, ...at },
  }
}

const todayISO = toISODate(today)

/**
 * The feed in Figma's `Notifications - D · Activity cards` (`40005993:27777`),
 * row for row, each pointed at the thing in the mock it is about. Where the
 * file's card icon disagrees with the data (Green Vitality is a Threads post,
 * Talan wrote on Threads), the card follows the data, so the icon matches the
 * place the click lands.
 */
export const seedNotifications: AppNotification[] = [
  {
    id: 'n-mention',
    group: 'today',
    sender: { type: 'person', name: 'Katie Powell', online: true },
    kind: 'mention',
    action: 'Mentioned you on a post',
    time: '3m',
    spokenTime: '3 minutes ago',
    card: {
      network: 'threads',
      title: 'Introducing Protein Plates',
      description: '@Nathan I swapped the hero for the overhead shot. Is 9 am still OK?',
    },
    profileId: 'vv-threads',
    unread: true,
    // Katie's reply in the post's notes thread (`data/posts.ts`, `c-2`).
    target: postTarget('p-12', { tab: 'notes', noteId: 'c-2' }),
  },
  {
    id: 'n-approval',
    group: 'today',
    sender: { type: 'person', name: 'Maya Okafor', online: true },
    kind: 'approval',
    action: 'Asked you to approve 2 posts',
    time: '12m',
    spokenTime: '12 minutes ago',
    card: {
      icon: Calendar,
      title: 'Smoothie Week',
      description: 'Due today, 11:00 am · Instagram and Threads',
    },
    profileId: 'vv-instagram',
    unread: true,
    // Approvals have no screen yet; the day they are due is where they sit.
    target: { path: `/plan/calendar?view=day&date=${todayISO}` },
  },
  {
    id: 'n-failed',
    group: 'today',
    sender: { type: 'network', name: 'Instagram', network: 'instagram' },
    kind: 'failed',
    action: 'A post didn’t publish',
    time: '1h',
    spokenTime: '1 hour ago',
    card: {
      icon: Calendar,
      title: 'Ice, Ice Baby 🥭🧊',
      description: 'Instagram needs reconnecting. Reconnect, then retry from the calendar.',
    },
    profileId: 'vv-instagram',
    unread: true,
    target: postTarget('p-13'),
  },
  {
    id: 'n-reply',
    group: 'today',
    sender: {
      type: 'person',
      name: '@carterdokidis',
      avatarName: 'Carter Dokidis',
      avatar: customerFor('carter').avatar,
    },
    kind: 'reply',
    action: 'Replied to Veggie Vault on Reddit',
    time: '2h',
    spokenTime: '2 hours ago',
    card: {
      network: 'reddit',
      title: 'Packaging question',
      description: 'Is the packaging compostable? Asking before I order a case.',
    },
    unread: false,
    target: { path: '/engage/all?message=1293' },
  },
  {
    id: 'n-insight',
    group: 'today',
    sender: { type: 'yak' },
    kind: 'insight',
    action: 'Spotted a spike on Threads',
    time: '3h',
    spokenTime: '3 hours ago',
    card: {
      icon: ChartNoAxesColumnIncreasing,
      title: 'Engagement up 32% since Friday',
      description: 'Three posts drove most of it. Open the report to see which.',
    },
    profileId: 'vv-threads',
    unread: false,
    target: { path: widgetPath('social-performance', 'posts') },
  },
  {
    id: 'n-comments',
    group: 'older',
    sender: { type: 'person', name: 'Katie Powell and 47 others', avatarName: 'Katie Powell' },
    kind: 'comments',
    action: 'Commented on a post',
    time: 'Sun',
    spokenTime: 'Sunday',
    card: {
      network: 'threads',
      title: 'Our Green Vitality Smoothie',
      description: '48 new comments since Saturday, mostly asking where to buy it.',
    },
    profileId: 'vv-threads',
    unread: false,
    target: { path: '/engage/comments?post=p-11' },
  },
  {
    id: 'n-followers',
    group: 'older',
    sender: { type: 'network', name: 'veggie_vault', network: 'instagram' },
    kind: 'followers',
    action: 'Gained 126 new followers',
    time: 'Sun',
    spokenTime: 'Sunday',
    card: {
      icon: ChartNoAxesColumnIncreasing,
      title: 'Audience growth',
      description: '18% more than last Monday.',
    },
    profileId: 'vv-instagram',
    unread: false,
    target: { path: boardPath('social-performance') },
  },
  {
    id: 'n-report-comment',
    group: 'older',
    sender: { type: 'person', name: 'Dana Okafor', online: true },
    kind: 'report-comment',
    action: 'Commented on a report',
    time: 'Sun',
    spokenTime: 'Sunday',
    card: {
      icon: ChartNoAxesColumnIncreasing,
      title: 'Weekly performance',
      description: 'Threads carried the week. Can we lean into it for Smoothie Week?',
    },
    unread: false,
    target: { path: boardPath('social-performance') },
  },
  {
    id: 'n-report',
    group: 'older',
    sender: { type: 'yak' },
    kind: 'report',
    action: 'Delivered your scheduled report',
    time: 'Sun',
    spokenTime: 'Sunday',
    card: {
      icon: ChartNoAxesColumnIncreasing,
      title: 'Weekly performance',
      description: 'Jun 30 – Jul 6 · shared with 4 people',
    },
    unread: false,
    target: { path: boardPath('social-performance') },
  },
  {
    id: 'n-assignment',
    group: 'older',
    sender: { type: 'person', name: 'Katie Powell', online: true },
    kind: 'assignment',
    action: 'Assigned you a conversation',
    time: 'Sat',
    spokenTime: 'Saturday',
    card: {
      network: 'threads',
      title: 'talan_torff · Asks if lentils are gone',
      description: 'Excited to try the Protein Plates! Are lentils gone forever?',
    },
    profileId: 'vv-threads',
    unread: false,
    target: { path: '/engage/all?message=1283' },
  },
  {
    id: 'n-campaign',
    group: 'older',
    sender: { type: 'person', name: 'Maya Okafor', online: true },
    kind: 'campaign',
    action: 'Scheduled a campaign',
    time: 'Fri',
    spokenTime: 'Friday',
    card: {
      icon: Calendar,
      title: 'Smoothie Week starts Monday',
      description: '9 posts across Instagram, Threads and Facebook',
    },
    unread: false,
    // The week the Smoothie Week note starts in (`data/notes.ts`).
    target: { path: `/plan/calendar?view=week&date=${todayISO}` },
  },
]
