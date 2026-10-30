import type { NotificationKind } from './notifications'

/**
 * The signed-in person's own settings, for Settings › General and
 * Notifications. The dialog holds one copy, so a switch flipped on one page is
 * still flipped after a visit to another.
 */

export interface Preferences {
  /** What Yak calls you in its replies. */
  nickname: string
  role: string
  timeZone: string
  /** Yak drafts a reply under each new inbox message. */
  yakSuggestReplies: boolean
  /** Yak writes a morning brief on Home. */
  yakDailyBrief: boolean
  /** Where notifications go, besides the bell. */
  delivery: { email: boolean; push: boolean; desktop: boolean }
  /** Which kinds reach you at all. */
  kinds: Record<NotifiableGroup, boolean>
  digest: 'off' | 'daily' | 'weekly'
}

/**
 * The notification kinds, grouped the way a person thinks about turning them
 * off. Failed posts are not here: they always notify (`NotificationsSection`).
 */
export type NotifiableGroup = 'conversation' | 'approvals' | 'audience' | 'reports' | 'work'

export const NOTIFIABLE_GROUPS: {
  id: NotifiableGroup
  label: string
  description: string
  kinds: NotificationKind[]
}[] = [
  {
    id: 'conversation',
    label: 'Mentions and replies',
    description: 'When someone mentions you or answers your note.',
    kinds: ['mention', 'reply'],
  },
  {
    id: 'approvals',
    label: 'Approvals',
    description: 'When a post is waiting on you, or one of yours is approved.',
    kinds: ['approval'],
  },
  {
    id: 'audience',
    label: 'Comments and followers',
    description: 'Busy posts and follower milestones on your channels.',
    kinds: ['comments', 'followers', 'insight'],
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'When a report is shared with you or someone comments on one.',
    kinds: ['report', 'report-comment'],
  },
  {
    id: 'work',
    label: 'Assignments and campaigns',
    description: 'Tickets assigned to you and campaigns you are on.',
    kinds: ['assignment', 'campaign'],
  },
]

export const ROLE_OPTIONS = [
  'Social media manager',
  'Marketing lead',
  'Content creator',
  'Community manager',
  'Agency',
  'Something else',
]

export const TIME_ZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney',
]

/** This browser's zone, when it is one of the list; New York when it isn't. */
function localTimeZone() {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return TIME_ZONES.includes(zone) ? zone : 'America/New_York'
}

export function defaultPreferences(): Preferences {
  return {
    nickname: 'Nathan',
    role: 'Social media manager',
    timeZone: localTimeZone(),
    yakSuggestReplies: true,
    yakDailyBrief: true,
    delivery: { email: true, push: false, desktop: true },
    kinds: { conversation: true, approvals: true, audience: false, reports: true, work: true },
    digest: 'daily',
  }
}
